import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '..');
const read = (file: string) => readFileSync(path.join(root, file), 'utf8');

const LOCKFILES = ['bun.lock', 'bun.lockb', 'yarn.lock', 'package-lock.json', 'pnpm-lock.yaml'];

describe('package manager policy', () => {
  it('commits bun.lock as the only lockfile, at the repository root', () => {
    const trackedFiles = execSync('git ls-files', { cwd: root, encoding: 'utf8' }).split('\n');
    const lockfiles = trackedFiles.filter(file => LOCKFILES.includes(path.basename(file)));

    // A merge from a branch still on another package manager can bring its lockfile back.
    expect(lockfiles).toEqual(['bun.lock']);
  });

  it('pins bun in package.json', () => {
    expect(JSON.parse(read('package.json')).packageManager).toMatch(/^bun@\d+\.\d+\.\d+$/);
  });

  it('points Dependabot at the bun ecosystem, the only one that can update bun.lock', () => {
    const ecosystems = [...read('.github/dependabot.yml').matchAll(/package-ecosystem:\s*"?([\w-]+)"?\s*$/gm)].map(
      match => match[1],
    );

    expect(ecosystems).toEqual(['bun']);
  });
});
