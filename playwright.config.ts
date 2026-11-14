import { defineConfig, devices } from '@playwright/test';
import { resolveBaseURL } from './e2e/lib/env';

// End-to-end tests live in e2e/, which Vitest's include globs never match (see scripts/repo-policy.spec.ts).
export default defineConfig({
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
    proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined,
  },
  projects: [
    { name: 'lib', testDir: 'e2e/lib' },
    // Checks the deployment is reachable before anything else runs against it.
    { name: 'setup', testDir: 'e2e/setup', testMatch: /.*\.setup\.ts/ },
    { name: 'blog', testDir: 'e2e/blog', dependencies: ['setup'], use: { ...devices['Desktop Chrome'] } },
  ],
});
