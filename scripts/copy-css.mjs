import { copyFileSync, writeFileSync } from 'node:fs';
import { format, resolveConfig } from 'prettier';
import { fileURLToPath } from 'node:url';
import { cssVariables, xdsThemes, palette, brand, neutral, dataViz } from '../dist/palette.js';
const fixed = Object.fromEntries(
  Object.entries({ palette, brand, neutral, dataViz }).flatMap(([group, values]) =>
    Object.entries(values).map(([key, value]) => [`--xds-${group}-${key}`, value]),
  ),
);
const block = (selector, name) =>
  `${selector} {\n  color-scheme: ${name};\n${Object.entries({
    ...fixed,
    ...cssVariables(xdsThemes[name]),
  })
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n')}\n}\n`;
const css = await format(
  '/* Generated from src/palette.ts by npm run build. Do not edit. */\n' +
    block(':root, [data-theme="dark"]', 'dark') +
    block('[data-theme="light"]', 'light'),
  {
    ...(await resolveConfig(fileURLToPath(new URL('../src/colors.css', import.meta.url)))),
    parser: 'css',
  },
);
writeFileSync(new URL('../src/colors.css', import.meta.url), css);
writeFileSync(new URL('../dist/colors.css', import.meta.url), css);
copyFileSync(
  new URL('../src/styles.css', import.meta.url),
  new URL('../dist/styles.css', import.meta.url),
);
