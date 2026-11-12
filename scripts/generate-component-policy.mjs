import { readFileSync, writeFileSync } from 'node:fs';
const registry = JSON.parse(
  readFileSync(new URL('../schema/component-registry.json', import.meta.url), 'utf8'),
);
const data = {
  version: registry.policyVersion,
  components: registry.components
    .filter((c) => c.fieldTypes.length || c.binding === 'coverages')
    .map(({ id, version, fieldTypes, description, binding }) => ({
      id,
      version,
      fieldTypes,
      description,
      ...(binding ? { semantic: binding } : {}),
    })),
  defaults: registry.defaults,
};
for (const rule of data.defaults)
  if (!data.components.some((c) => c.id === rule.ref.id && c.version === rule.ref.version))
    throw new Error('Invalid policy default');
const target = new URL('../../EnsuredConstants/src/componentPolicy.generated.ts', import.meta.url);
const content =
  '// Generated from EnsuredXDS/schema/component-registry.json. Do not edit.\nexport const generatedPolicy = ' +
  JSON.stringify(data, null, 2) +
  ';\n';
if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== content) throw new Error('Component policy is stale');
} else writeFileSync(target, content);
