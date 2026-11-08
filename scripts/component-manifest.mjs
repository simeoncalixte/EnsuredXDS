import ts from 'typescript';
import path from 'node:path';

// These are supplied by the renderer, not generated as component configuration.
const runtimeProps = new Set([
  'children',
  'key',
  'ref',
  'value',
  'defaultValue',
  'checked',
  'defaultChecked',
  'style',
  'dangerouslySetInnerHTML',
]);

export function createPropsExtractor(tsconfigPath) {
  const config = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (config.error)
    throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(tsconfigPath));
  if (parsed.errors.length)
    throw new Error(
      parsed.errors.map((e) => ts.flattenDiagnosticMessageText(e.messageText, '\n')).join('\n'),
    );
  const program = ts.createProgram(parsed.fileNames, { ...parsed.options, noEmit: true });
  const checker = program.getTypeChecker();

  function schemaFor(type, seen = new Set()) {
    const f = type.flags;
    if (
      f &
      (ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.Never | ts.TypeFlags.TypeParameter)
    ) {
      throw new Error('Unresolved, unconstrained, or unsupported type');
    }
    if (f & ts.TypeFlags.StringLiteral) return { type: 'string', const: type.value };
    if (f & ts.TypeFlags.NumberLiteral) return { type: 'number', const: type.value };
    if (f & ts.TypeFlags.BooleanLiteral)
      return { type: 'boolean', const: type.intrinsicName === 'true' };
    if (f & ts.TypeFlags.String) return { type: 'string' };
    if (f & ts.TypeFlags.Number) return { type: 'number' };
    if (f & ts.TypeFlags.Boolean) return { type: 'boolean' };
    if (f & ts.TypeFlags.Null) return { type: 'null' };
    if (seen.has(type) || seen.size > 12)
      throw new Error('Recursive or deeply nested type requires an explicit schema');
    const next = new Set([...seen, type]);
    if (type.isUnion()) {
      // Every branch must be representable; never silently discard callbacks or undefined.
      const choices = type.types.map((t) => schemaFor(t, next));
      if (choices.length === 2 && choices.every((s) => s.type === 'boolean'))
        return { type: 'boolean' };
      return { anyOf: choices };
    }
    if (type.getCallSignatures().length || type.getConstructSignatures().length)
      throw new Error('Function or constructor supplied by the UI');
    if (checker.isTupleType(type)) throw new Error('Tuple requires an explicit schema');
    if (checker.isArrayType(type) || type.getSymbol()?.name === 'ReadonlyArray') {
      return { type: 'array', items: schemaFor(checker.getTypeArguments(type)[0], next) };
    }
    if (!(f & ts.TypeFlags.Object) && !type.isIntersection()) throw new Error('Non-JSON type');
    const symbol = type.getSymbol();
    if (symbol?.declarations?.some((d) => ts.isClassDeclaration(d)))
      throw new Error('Class instance is not a JSON object');
    const properties = {};
    const required = [];
    for (const prop of checker.getPropertiesOfType(type)) {
      properties[prop.name] = propertySchema(prop, next);
      if (!(prop.flags & ts.SymbolFlags.Optional)) required.push(prop.name);
    }
    const indexes = checker.getIndexInfosOfType(type);
    if (indexes.some((i) => !(i.keyType.flags & ts.TypeFlags.String)))
      throw new Error('Non-string index requires an explicit schema');
    if (!Object.keys(properties).length && !indexes.length)
      throw new Error('Empty object type does not constrain JSON values');
    return {
      type: 'object',
      properties,
      additionalProperties: indexes.length ? schemaFor(indexes[0].type, next) : false,
      ...(required.length ? { required } : {}),
    };
  }

  function propertySchema(prop, seen) {
    const declaration = prop.valueDeclaration ?? prop.declarations?.[0];
    let type = checker.getTypeOfSymbolAtLocation(prop, declaration);
    if (prop.flags & ts.SymbolFlags.Optional && type.isUnion()) {
      const members = type.types.filter((t) => !(t.flags & ts.TypeFlags.Undefined));
      if (members.length === 1) type = members[0];
      else {
        const choices = members.map((t) => schemaFor(t, seen));
        if (choices.length === 2 && choices.every((s) => s.type === 'boolean'))
          return { type: 'boolean' };
        return { anyOf: choices };
      }
    }
    const schema = schemaFor(type, seen);
    const description = ts.displayPartsToString(prop.getDocumentationComment(checker));
    return description ? { ...schema, description } : schema;
  }

  return function extractComponentProps(filePath, exportName = 'default') {
    const source = program.getSourceFile(path.resolve(filePath));
    if (!source) throw new Error(`Component not included in tsconfig: ${filePath}`);
    const module = checker.getSymbolAtLocation(source);
    let exported = module && checker.getExportsOfModule(module).find((s) => s.name === exportName);
    if (!exported) throw new Error(`Missing export ${exportName} in ${filePath}`);
    if (exported.flags & ts.SymbolFlags.Alias) exported = checker.getAliasedSymbol(exported);
    const component = checker.getTypeOfSymbolAtLocation(
      exported,
      exported.valueDeclaration ?? source,
    );
    // Styled components expose a polymorphic overload plus their concrete base props.
    // Extract the base signature, without exposing `as`/`forwardedAs` configuration.
    const signatures = component
      .getCallSignatures()
      .filter(
        (signature) =>
          !component.getProperty('styledComponentId') || !signature.typeParameters?.length,
      );
    if (signatures.length !== 1)
      throw new Error(`Expected one component call signature: ${filePath}#${exportName}`);
    const parameter = signatures[0].parameters[0];
    const props =
      parameter &&
      checker.getTypeOfSymbolAtLocation(parameter, parameter.valueDeclaration ?? source);
    const branches = props?.isUnion() ? props.types : [props];
    const results = branches.map((branch) => extractProps(branch, filePath));
    if (results.length === 1) return results[0];
    // Keep branch-specific properties and requirements together; flattening a union
    // would allow combinations that no actual component signature accepts.
    return {
      propsSchema: { anyOf: results.map((result) => result.propsSchema) },
      excludedProps: results.flatMap((result, branch) =>
        result.excludedProps.map((prop) => ({ ...prop, branch })),
      ),
    };
  };

  function extractProps(props, filePath) {
    if (props && !(props.flags & ts.TypeFlags.Object) && !props.isIntersection()) {
      throw new Error(
        `Unresolved or non-object component props require explicit handling: ${filePath}`,
      );
    }
    const properties = {};
    const required = [];
    const excludedProps = [];
    for (const prop of (props ? checker.getPropertiesOfType(props) : []).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      try {
        if (runtimeProps.has(prop.name) || ['as', 'forwardedAs'].includes(prop.name))
          throw new Error('Owned by the UI renderer/data binding');
        properties[prop.name] = propertySchema(prop, new Set());
        if (!(prop.flags & ts.SymbolFlags.Optional)) required.push(prop.name);
      } catch (error) {
        excludedProps.push({
          name: prop.name,
          required: !(prop.flags & ts.SymbolFlags.Optional),
          reason: error.message,
        });
      }
    }
    return {
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        properties,
        ...(required.length ? { required } : {}),
      },
      excludedProps,
    };
  }
}

/** Retain reviewed IDs/bindings and constraints; derive configuration props from source. */
export function generateComponentManifest({ tsconfigPath, componentsDirectory, registry }) {
  const extract = createPropsExtractor(tsconfigPath);
  return {
    ...registry,
    components: registry.components.map((component) => {
      const name = component.export.split('/').pop();
      const extracted = extract(
        path.join(componentsDirectory, `${name}.tsx`),
        component.exportName ?? 'default',
      );
      if (component.propsSchema) {
        // Hand-written limits (maxLength, minimum, etc.) cannot be inferred from TS.
        extracted.propsSchema.allOf = [component.propsSchema];
      }
      return { ...component, ...extracted };
    }),
  };
}
