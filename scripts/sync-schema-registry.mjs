import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const source = new URL('../schema/component-registry.json', import.meta.url);
const registry = JSON.parse(readFileSync(source, 'utf8'));
// The generated UI catalog includes more components than the legacy field renderer
// can instantiate. Only publish controls with an existing workbench adapter here.
const fieldIds = JSON.parse(
  readFileSync(new URL('../schema/form-catalog-components.json', import.meta.url), 'utf8'),
);
for (const id of fieldIds) {
  if (!registry.components.some((component) => component.id === id))
    throw new Error(`Unknown form catalog component: ${id}`);
}
for (const component of registry.components) {
  const name = component.export.split('/').pop();
  if (!existsSync(new URL(`../src/components/${name}.tsx`, import.meta.url)))
    throw new Error(`Missing XDS component: ${name}`);
}
const manifest =
  JSON.stringify(
    {
      ...registry,
      components: registry.components.filter((component) => fieldIds.includes(component.id)),
    },
    null,
    2,
  ) + '\n';
for (const path of [
  '../../EnsuredAPI/src/formCatalog/xds-components.json',
  '../../EnsuredUI/src/schema/xds-components.json',
  '../../EnsuredPipelineShared/src/formCatalog/xds-components.json',
]) {
  const target = new URL(path, import.meta.url);
  if (process.argv.includes('--check')) {
    if (readFileSync(target, 'utf8') !== manifest)
      throw new Error(`Registry copy out of date: ${path}`);
  } else writeFileSync(target, manifest);
}
