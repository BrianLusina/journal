import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '..');
const trackedFiles = execSync('git ls-files', { cwd: root, encoding: 'utf8' }).split('\n');
const read = (file: string) => readFileSync(path.join(root, file), 'utf8');

describe('package manager policy', () => {
  it('commits bun.lock as the only lockfile', () => {
    const lockfiles = trackedFiles.filter(file =>
      ['bun.lock', 'bun.lockb', 'yarn.lock', 'package-lock.json', 'pnpm-lock.yaml'].includes(file),
    );

    // A merge from a branch still on another package manager can bring its lockfile back.
    expect(lockfiles).toEqual(['bun.lock']);
  });

  it('pins bun in package.json', () => {
    expect(JSON.parse(read('package.json')).packageManager).toMatch(/^bun@\d+\.\d+\.\d+$/);
  });

  it('points Dependabot at the bun ecosystem, the only one that can update bun.lock', () => {
    const config = read('.github/dependabot.yml');

    expect(config).toMatch(/package-ecosystem:\s*"?bun"?/);
    expect(config).not.toMatch(/package-ecosystem:\s*"?npm"?/);
  });
});
