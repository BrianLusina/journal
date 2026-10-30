/**
 * Bundles the server and each function in api/, with the packages they import, into
 * dist-server/, so the Docker image needs no node_modules. Run it with `bun server/build.ts`.
 */
import path from 'node:path';
import { discoverRoutes } from './router';

const root = path.resolve(import.meta.dirname, '..');
const apiDir = path.join(root, 'api');
const outDir = path.join(root, 'dist-server');

const builds = [
  // One bundle per function, as on Vercel, at the same path so the server routes it the same way.
  {
    entrypoints: discoverRoutes(apiDir).map(route => route.file),
    root: apiDir,
    outdir: path.join(outDir, 'api'),
  },
  { entrypoints: [path.join(root, 'server', 'index.ts')], outdir: path.join(outDir, 'server') },
];

for (const options of builds) {
  const result = await Bun.build({ ...options, target: 'bun' });
  if (!result.success) {
    console.error(...result.logs);
    process.exit(1);
  }
}
