import { mkdtempSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { gzipSync } from 'zlib';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { initialScripts, initialSize } = require('./bundle-budget');

const html = `<!doctype html>
<html>
  <head>
    <link rel="icon" href="/assets/icons/favicon.png" />
    <script type="module" crossorigin src="/assets/index-abc.js"></script>
    <link rel="modulepreload" crossorigin href="/assets/vendor-def.js">
    <link rel="stylesheet" crossorigin href="/assets/index-ghi.css">
  </head>
</html>`;

describe('bundle budget', () => {
  it('finds the entry script and the chunks it preloads, which every first visit downloads', () => {
    expect(initialScripts(html)).toEqual(['assets/index-abc.js', 'assets/vendor-def.js']);
  });

  it('sums the gzipped size of those scripts in kB, leaving out lazily loaded chunks', () => {
    const dist = mkdtempSync(path.join(tmpdir(), 'dist-'));
    mkdirSync(path.join(dist, 'assets'));
    writeFileSync(path.join(dist, 'index.html'), html);
    const entry = 'const entry = 1;'.repeat(500);
    const vendor = 'const vendor = 2;'.repeat(500);
    writeFileSync(path.join(dist, 'assets/index-abc.js'), entry);
    writeFileSync(path.join(dist, 'assets/vendor-def.js'), vendor);
    writeFileSync(path.join(dist, 'assets/lazy-jkl.js'), 'const lazy = 3;'.repeat(500));

    expect(initialSize(dist)).toBe((gzipSync(entry).length + gzipSync(vendor).length) / 1000);
  });
});
