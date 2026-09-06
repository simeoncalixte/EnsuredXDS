import { copyFileSync } from 'node:fs';
for (const name of ['colors', 'styles']) copyFileSync(new URL(`../src/${name}.css`, import.meta.url), new URL(`../dist/${name}.css`, import.meta.url));
