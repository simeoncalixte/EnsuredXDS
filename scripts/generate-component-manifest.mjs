import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { generateComponentManifest } from './component-manifest.mjs';

const manifest = generateComponentManifest({
  tsconfigPath: fileURLToPath(new URL('../tsconfig.build.json', import.meta.url)),
  componentsDirectory: fileURLToPath(new URL('../src/components', import.meta.url)),
  registry: JSON.parse(readFileSync(new URL('../schema/component-registry.json', import.meta.url), 'utf8')),
});
const contents = JSON.stringify(manifest, null, 2) + '\n';
const targets = [new URL('../schema/component-manifest.generated.json', import.meta.url)];
if (process.argv.includes('--sync')) targets.push(new URL('../../EnsuredPipelineShared/src/formCatalog/xds-components.generated.json', import.meta.url));
for (const target of targets) {
  if (process.argv.includes('--check')) {
    if (readFileSync(target, 'utf8') !== contents) throw new Error(`Generated manifest is stale: ${target.pathname}`);
  } else writeFileSync(target, contents);
}
console.log(`Generated prop schemas for ${manifest.components.length} components${process.argv.includes('--check') ? ' verified' : ''}.`);
