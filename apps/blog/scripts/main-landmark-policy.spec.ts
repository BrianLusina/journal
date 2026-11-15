import { readdirSync, readFileSync } from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src');
const layout = path.join(src, 'layouts', 'MainLayout.tsx');

const SOURCE = /\.(ts|tsx|js|jsx)$/;
// Tests and stories don't count as app code: they may wrap what they render in a <main>.
const NOT_APP_CODE = /\.(spec|test|stories)\.[jt]sx?$|\.d\.ts$/;
const MAIN_TAG = /<main[\s>]/;

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return SOURCE.test(entry.name) && !NOT_APP_CODE.test(entry.name) ? [full] : [];
  });

describe('main landmark', () => {
  it('is rendered by MainLayout only, so pages never nest a second <main> inside it', () => {
    const offenders = sourceFiles(src)
      .filter(file => file !== layout && MAIN_TAG.test(readFileSync(file, 'utf8')))
      .map(file => path.relative(root, file));

    expect(offenders).toEqual([]);
  });
});
