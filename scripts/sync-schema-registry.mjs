import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const source = new URL('../schema/component-registry.json', import.meta.url);
const manifest = readFileSync(source, 'utf8');
for (const component of JSON.parse(manifest).components) {
  const name = component.export.split('/').pop();
  if (!existsSync(new URL(`../src/components/${name}.tsx`, import.meta.url))) throw new Error(`Missing XDS component: ${name}`);
}
for (const path of ['../../EnsuredAPI/src/formCatalog/xds-components.json','../../EnsuredUI/src/schema/xds-components.json']) {
  const target = new URL(path, import.meta.url);
  if (process.argv.includes('--check')) {
    if (readFileSync(target, 'utf8') !== manifest) throw new Error(`Registry copy out of date: ${path}`);
  } else writeFileSync(target, manifest);
}
