import { defineConfig, devices } from '@playwright/test';
import { resolveBaseURL } from './e2e/lib/env';

// End-to-end tests live in e2e/, which Vitest's include globs never match (see scripts/repo-policy.spec.ts).
// `site` is the e2e/sites fixture's option: which site a project's specs expect.
export default defineConfig<{ site: 'home' | 'folio' }>({
  testDir: 'e2e',
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: resolveBaseURL(process.env),
    trace: 'off',
    screenshot: 'only-on-failure',
    launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined },
    // Lets the request fixture work behind an outbound proxy; unset in CI, where it changes nothing.
    proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined,
  },
  projects: [
    { name: 'lib', testDir: 'e2e/lib' },
    // Checks the deployment is reachable before anything else runs against it.
    { name: 'setup', testDir: 'e2e/setup', testMatch: /.*\.setup\.ts/ },
    { name: 'blog', testDir: 'e2e/blog', dependencies: ['setup'], use: { ...devices['Desktop Chrome'] } },
    // apps/sites: on a preview URL, the site fixture picks the site with the `site` cookie.
    // Each also runs the specs shared by both sites, in e2e/sites/.
    { name: 'home', testDir: 'e2e', testMatch: /e2e\/(home|sites)\/.*\.spec\.ts$/, use: { ...devices['Desktop Chrome'], site: 'home' } },
    { name: 'folio', testDir: 'e2e', testMatch: /e2e\/(folio|sites)\/.*\.spec\.ts$/, use: { ...devices['Desktop Chrome'], site: 'folio' } },
  ],
});
