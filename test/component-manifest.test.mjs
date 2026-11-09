import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import { createPropsExtractor, generateComponentManifest } from '../scripts/component-manifest.mjs';

test('extracts inherited/nested JSON props and reports unsupported props without weakening unions', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'xds-props-'));
  try {
    writeFileSync(
      path.join(dir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: { strict: true, types: [], skipLibCheck: true },
        include: ['*.ts'],
      }),
    );
    writeFileSync(
      path.join(dir, 'component.ts'),
      `
      interface Base { label: string; disabled?: boolean }
      interface Loop { next: Loop }
      interface Props extends Base {
        variant?: 'small' | 'large'; count?: number | null;
        rows: ReadonlyArray<{ name: string; score?: number }>;
        lookup?: Record<string, number>;
        onChange: (value: string) => void;
        mixed?: string | (() => void);
        unknownValue?: unknown; loose?: any; recursive?: Loop;
        value: string; children?: string;
        date?: Date; bigint?: bigint;
      }
      export default function Component(props: Props) { return null; }
      export function Untyped(props: any) { return null; }
      export function Union(props: { mode: 'text'; text: string; onChange: () => void } | { mode: 'count'; count: number; value: number }) { return null; }
    `,
    );
    const extract = createPropsExtractor(path.join(dir, 'tsconfig.json'));
    const result = extract(path.join(dir, 'component.ts'));
    const validate = new Ajv({ strict: false }).compile(result.propsSchema);
    assert.deepEqual(result.propsSchema.required, ['label', 'rows']);
    assert.equal(
      validate({
        label: 'Example',
        rows: [{ name: 'A', score: 2 }],
        disabled: true,
        count: null,
        variant: 'small',
        lookup: { a: 1 },
      }),
      true,
    );
    assert.equal(validate({ rows: [] }), false);
    assert.equal(validate({ label: 'Example', rows: [{ name: 5 }] }), false);
    assert.equal(validate({ label: 'Example', rows: [], variant: 'other' }), false);
    assert.equal(validate({ label: 'Example', rows: [], onChange: 'code' }), false);
    for (const name of [
      'onChange',
      'mixed',
      'unknownValue',
      'loose',
      'recursive',
      'value',
      'children',
      'date',
      'bigint',
    ]) {
      assert.ok(
        result.excludedProps.some((p) => p.name === name),
        name,
      );
      assert.equal(result.propsSchema.properties[name], undefined);
    }
    assert.throws(() => extract(path.join(dir, 'component.ts'), 'Untyped'), /Unresolved/);
    assert.throws(() => extract(path.join(dir, 'component.ts'), 'Missing'), /Missing export/);
    const union = extract(path.join(dir, 'component.ts'), 'Union');
    const validateUnion = new Ajv({ strict: false }).compile(union.propsSchema);
    assert.equal(validateUnion({ mode: 'text', text: 'Hello' }), true);
    assert.equal(validateUnion({ mode: 'count', count: 2 }), true);
    for (const invalid of [
      { mode: 'text', count: 2 },
      { mode: 'count' },
      { mode: 'text', text: 'Hi', count: 2 },
    ]) {
      assert.equal(validateUnion(invalid), false);
    }
    assert.ok(
      union.excludedProps.some(
        (prop) => prop.name === 'onChange' && prop.branch === 0 && prop.required,
      ),
    );
    assert.ok(
      union.excludedProps.some(
        (prop) => prop.name === 'value' && prop.branch === 1 && prop.required,
      ),
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('generates the XDS catalog without executing React and preserves reviewed validation', () => {
  const registry = JSON.parse(
    readFileSync(new URL('../schema/component-registry.json', import.meta.url), 'utf8'),
  );
  const manifest = generateComponentManifest({
    tsconfigPath: fileURLToPath(new URL('../tsconfig.build.json', import.meta.url)),
    componentsDirectory: fileURLToPath(new URL('../src/components', import.meta.url)),
    registry,
  });
  const ajv = new Ajv({ strict: false });
  for (const component of manifest.components) ajv.compile(component.propsSchema);
  const input = manifest.components.find((c) => c.id === 'xds.input');
  assert.equal(input.propsSchema.properties.placeholder.type, 'string');
  assert.ok(input.excludedProps.some((p) => p.name === 'onChange'));
  const coverage = manifest.components.find((c) => c.id === 'xds.requested-coverage');
  const validate = ajv.compile(coverage.propsSchema);
  assert.equal(validate({ title: 'Coverage', allowRename: true, termsMaxLength: 500 }), true);
  assert.equal(validate({ termsMaxLength: 0 }), false);
  assert.equal(validate({ termsMaxLength: 1.5 }), false);
  assert.equal(validate({ title: 'x'.repeat(121) }), false);
  assert.equal(validate({ value: [] }), false);
  assert.equal(coverage.binding, 'coverages');
  assert.deepEqual(
    coverage.dataSchema,
    registry.components.find((c) => c.id === coverage.id).dataSchema,
  );
  assert.deepEqual(
    manifest,
    JSON.parse(
      readFileSync(new URL('../schema/component-manifest.generated.json', import.meta.url), 'utf8'),
    ),
  );
  assert.deepEqual(
    manifest,
    JSON.parse(
      readFileSync(
        new URL(
          '../../EnsuredPipelineShared/src/formCatalog/xds-components.generated.json',
          import.meta.url,
        ),
        'utf8',
      ),
    ),
  );

  // Every component that can live in a form/section is registered. Application
  // shell navigation and global theme switching are deliberately out of scope.
  const shellComponents = new Set([
    'Navigation',
    'SideNavBar',
    'SideBarNav',
    'ScrollableNavigation',
    'ThemeToggle',
    'RightHandPanel', // Application filtering shell, not a generated form control.
  ]);
  const registered = new Set(
    manifest.components.map((component) => component.export.split('/').pop()),
  );
  for (const filename of readdirSync(new URL('../src/components', import.meta.url))) {
    if (!filename.endsWith('.tsx') || filename.endsWith('.stories.tsx')) continue;
    const name = filename.slice(0, -4);
    assert.equal(registered.has(name), !shellComponents.has(name), name);
  }
  assert.equal(
    new Set(manifest.components.map((component) => component.id)).size,
    manifest.components.length,
  );
  const segmented = manifest.components.find(
    (component) => component.id === 'xds.segmented-switch',
  );
  const validateSegmented = ajv.compile(segmented.propsSchema);
  assert.equal(validateSegmented({ options: ['Yes', 'No'] }), true);
  assert.equal(validateSegmented({ options: [{ label: 'Yes', value: 'yes' }] }), true);
  assert.equal(validateSegmented({ options: ['Yes', { label: 'No', value: 'no' }] }), false);
  assert.equal(validateSegmented({}), false);
  assert.equal(validateSegmented({ options: ['Yes'], value: 0 }), false);
  const title = manifest.components.find((component) => component.id === 'xds.page-title');
  assert.equal(title.exportName, 'PageTitle');
  assert.equal(ajv.compile(title.propsSchema)({ id: 'heading', className: 'title' }), true);
  assert.ok(title.excludedProps.some((prop) => prop.name === 'children'));
  assert.equal(title.propsSchema.properties.as, undefined);
  const selection = manifest.components.find((component) => component.id === 'xds.selection-card');
  assert.equal(
    ajv.compile(selection.propsSchema)({ title: 'Property', selectionId: 'property' }),
    true,
  );
  assert.equal(ajv.compile(selection.propsSchema)({ selectionId: 'property' }), false);
});
