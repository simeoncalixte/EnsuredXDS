import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  realpathSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { build } from 'vite';
const root = fileURLToPath(new URL('../', import.meta.url));

test('shared source imports stay inside the package and contain no application environment/API dependencies', () => {
  function walk(dir) {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, item.name);
      if (item.isDirectory()) walk(path);
      else if (/\.[jt]sx?$/.test(path)) {
        const source = readFileSync(path, 'utf8');
        assert.doesNotMatch(source, /import\.meta\.env|\/api\/|useAuthMe/);
        for (const match of source.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)) {
          assert.ok(resolve(dirname(path), match[1]).startsWith(join(root, 'src') + '/'), path);
        }
      }
    }
  }
  walk(join(root, 'src'));
});

test('a packed artifact builds in a separate consumer with exported components, styles and declarations', async () => {
  const temp = realpathSync(mkdtempSync(join(tmpdir(), 'ensured-xds-consumer-')));
  try {
    const packed = JSON.parse(
      execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', temp], {
        cwd: root,
        encoding: 'utf8',
      }),
    )[0];
    assert.ok(packed.files.some((f) => f.path === 'dist/index.d.ts'));
    assert.ok(packed.files.some((f) => f.path === 'schema/component-registry.json'));
    assert.equal(
      JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).exports[
        './schema/component-registry.json'
      ],
      './schema/component-registry.json',
    );
    assert.ok(packed.files.some((f) => f.path === 'dist/colors.css'));
    assert.ok(
      !packed.files.some((f) => f.path.includes('.stories.') || f.path.includes('node_modules/')),
    );
    const deps = { '@ensured/xds': `file:${join(temp, packed.filename)}` };
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    for (const name of [...Object.keys(pkg.peerDependencies), '@types/react'])
      deps[name] = JSON.parse(
        readFileSync(join(root, 'node_modules', name, 'package.json'), 'utf8'),
      ).version;
    writeFileSync(
      join(temp, 'package.json'),
      JSON.stringify({ private: true, type: 'module', dependencies: deps }),
    );
    execFileSync(
      'npm',
      ['install', '--prefer-offline', '--ignore-scripts', '--no-audit', '--no-fund'],
      {
        cwd: temp,
        stdio: 'pipe',
      },
    );
    writeFileSync(
      join(temp, 'index.html'),
      '<div id="root"></div><script type="module" src="/main.jsx"></script>',
    );
    writeFileSync(
      join(temp, 'main.jsx'),
      `import React from 'react';
      import { createRoot } from 'react-dom/client';
      import { XdsThemeProvider, Button } from '@ensured/xds';
      import Card from '@ensured/xds/components/Card';
      import '@ensured/xds/colors.css';
      import '@ensured/xds/styles.css';
      createRoot(document.getElementById('root')).render(<XdsThemeProvider><Card><Button>Shared library</Button></Card></XdsThemeProvider>);`,
    );
    writeFileSync(
      join(temp, 'check.ts'),
      `import { Button, XdsThemeProvider } from '@ensured/xds';
      import type { ComponentProps } from 'react';
      const props: ComponentProps<typeof Button> = { children: 'Typed consumer' };
      export { props, XdsThemeProvider };`,
    );
    execFileSync(
      join(root, 'node_modules/.bin/tsc'),
      [
        '--noEmit',
        '--strict',
        '--skipLibCheck',
        '--moduleResolution',
        'bundler',
        '--module',
        'esnext',
        '--jsx',
        'react-jsx',
        'check.ts',
      ],
      { cwd: temp, stdio: 'pipe' },
    );
    await build({ root: temp, configFile: false, logLevel: 'error', build: { outDir: 'output' } });
    assert.ok(readFileSync(join(temp, 'output/index.html'), 'utf8').includes('/assets/'));
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});
