import { readdirSync, readFileSync } from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src');
const uiDir = path.join(src, 'components', 'ui');

const SOURCE = /\.(ts|tsx|js|jsx)$/;
// Tests and stories don't count as app code: a primitive only they import is still unused.
const NOT_APP_CODE = /\.(spec|test|stories)\.[jt]sx?$|\.d\.ts$/;
const IMPORT = /\b(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g;

const stripExtension = (file: string) => file.replace(SOURCE, '');

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return SOURCE.test(entry.name) && !NOT_APP_CODE.test(entry.name) ? [full] : [];
  });

// Import specifiers resolved to extensionless absolute paths (only the `@/` alias reaches src/components/ui).
const importsOf = (file: string): string[] =>
  [...readFileSync(file, 'utf8').matchAll(IMPORT)]
    .map(match => match[1])
    .filter(spec => spec.startsWith('@/') || spec.startsWith('.'))
    .map(spec => (spec.startsWith('@/') ? path.join(src, spec.slice(2)) : path.resolve(path.dirname(file), spec)))
    .map(stripExtension);

describe('vendored shadcn/ui primitives', () => {
  it('keeps only primitives the app imports at the top level of src/components/ui', () => {
    const primitives = sourceFiles(uiDir).filter(file => path.dirname(file) === uiDir);

    // A primitive counts as used when app code imports it, or when a used primitive does
    // (e.g. toggle-group pulls in toggle).
    const used = new Set(sourceFiles(src).filter(file => !primitives.includes(file)).flatMap(importsOf));
    const queue = primitives.filter(file => used.has(stripExtension(file)));
    for (const primitive of queue) {
      importsOf(primitive).forEach(spec => {
        const dependency = primitives.find(file => stripExtension(file) === spec);
        if (dependency && !used.has(spec)) {
          used.add(spec);
          queue.push(dependency);
        }
      });
    }

    const unused = primitives
      .filter(file => !used.has(stripExtension(file)))
      .map(file => path.relative(root, file));

    // Delete unused primitives; re-add one with `bunx shadcn add <name>` when the app needs it.
    expect(unused).toEqual([]);
  });
});
