import { execSync } from 'child_process';
import { existsSync, readdirSync, readFileSync } from 'fs';
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

// The Vite and bun migration left parts of the Create React App toolchain behind (#807).
describe('toolchain left over from Create React App', () => {
  const workflows = readdirSync(path.join(root, '.github/workflows')).filter(file => /\.ya?ml$/.test(file));

  it.each(workflows)('%s does not use yarn, Node 16 or actions/cache@v2', file => {
    const workflow = read(`.github/workflows/${file}`);

    expect(workflow).not.toMatch(/\byarn\b/);
    expect(workflow).not.toMatch(/node-version:\s*['"]?16\b/);
    expect(workflow).not.toMatch(/actions\/cache@v2\b/);
  });

  it.each(workflows)('%s uses the Vite variable names and output directory', file => {
    const workflow = read(`.github/workflows/${file}`);

    // Vite only exposes VITE_-prefixed variables to the app, and it emits dist/, not build/.
    expect(workflow).not.toMatch(/^\s+(?:CMS_\w+|FIREBASE_\w+|SENTRY_DSN|ENV):/m);
    expect(workflow).not.toMatch(/(?:^|[\s'"])(?:\.\/)?build\//m);
  });

  it('builds the Docker image with bun from bun.lock', () => {
    const dockerfile = read('Dockerfile');

    // npm ci needs a package-lock.json, which bun does not write.
    expect(dockerfile).not.toMatch(/package-lock|bun\.lockb|\bnpm\b|\byarn\b/);
    expect(dockerfile).toMatch(/^COPY package\.json bun\.lock /m);
    expect(dockerfile).toMatch(/^RUN bun install --frozen-lockfile/m);
    expect(dockerfile).toMatch(/^RUN bun run build$/m);
  });

  it('has no package scripts for the webpack toolchain, Surge or the build/ directory', () => {
    const scripts: string[] = Object.values(JSON.parse(read('package.json')).scripts);
    const craScript = /start-storybook|^build-storybook|scripts\/\w+\.js|\bsurge\b|(?:-s|-rf) build\b/;

    expect(scripts.filter(script => craScript.test(script))).toEqual([]);
  });

  it.each([
    'public/index.html',
    'src/types/react-app-env.d.ts',
    'netlify.toml',
    'config/webpack.config.js',
    'scripts/start.js',
    '.eslintrc.js',
  ])('does not bring back %s', file => {
    expect(existsSync(path.join(root, file))).toBe(false);
  });
});
    
describe('type-check policy', () => {
  it('type-checks src/ in the Tests workflow, since neither vite build nor Jest does', () => {
    expect(JSON.parse(read('package.json')).scripts.typecheck).toBe(
      'tsc -p tsconfig.app.json --noEmit',
    );
  expect(read('.github/workflows/tests.yml')).toMatch(/^\s*run: bun run typecheck\s*$/m);
});