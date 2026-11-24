import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// The blog's Vercel functions are CommonJS and load @brianlusina/cms/server with require(). An ES-only
// dependency then needs Node's require(esm), which some runtimes don't have, and a dependency that
// fails to load crashes every function that imports the server entry, every source's routes at once.
// So every runtime dependency must load with require(esm) turned off.
const { dependencies } = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8')) as {
  dependencies: Record<string, string>;
};

describe('runtime dependencies', () => {
  it.each(Object.keys(dependencies))('%s loads as CommonJS, without require(esm)', name => {
    expect(() =>
      execFileSync(process.execPath, ['--no-experimental-require-module', '-e', `require(${JSON.stringify(name)})`], {
        cwd: __dirname,
        stdio: 'pipe',
      }),
    ).not.toThrow();
  });
});
