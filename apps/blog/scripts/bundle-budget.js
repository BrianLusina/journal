/**
 * Fails when the JavaScript every first visit downloads before the page renders grows past the
 * budget. Run it after `bun run build`: `bun run check:bundle-size`.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Gzipped kB of the entry chunk and the chunks it preloads. It was 220 kB with Firebase and
// Sentry in it and 172 kB without (#810); the headroom allows for ordinary features but fails
// when an SDK lands back in the first bundle.
const BUDGET_KB = 185;

/** The scripts index.html loads up front: the entry module and the chunks it preloads. */
const initialScripts = html =>
  [...html.matchAll(/<(?:script[^>]*\ssrc|link[^>]*rel="modulepreload"[^>]*\shref)="\/?([^"]+\.js)"/g)].map(
    match => match[1],
  );

/** The gzipped size, in kB, of the initial scripts of the build in distDir. */
const initialSize = distDir => {
  const html = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
  const bytes = initialScripts(html).reduce(
    (total, file) => total + zlib.gzipSync(fs.readFileSync(path.join(distDir, file))).length,
    0,
  );
  return bytes / 1000;
};

if (require.main === module) {
  const size = initialSize(path.resolve(__dirname, '..', 'dist'));
  console.log(`Initial JavaScript: ${size.toFixed(2)} kB gzipped (budget ${BUDGET_KB} kB).`);
  if (size > BUDGET_KB) {
    console.error('Over budget: load the new dependency lazily with import(), or raise BUDGET_KB on purpose.');
    process.exit(1);
  }
}

module.exports = { BUDGET_KB, initialScripts, initialSize };
