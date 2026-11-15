import { test, expect } from '../fixtures';
import { SNAPSHOT_ARTICLE_PATH } from './routes.data';

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'article', path: SNAPSHOT_ARTICLE_PATH },
  { name: 'about', path: '/about' },
] as const;
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
] as const;
const THEMES = ['light', 'dark'] as const;

// Fonts render differently per OS, so screenshots are only generated and compared in the CI
// container (mcr.microsoft.com/playwright, see .github/workflows/e2e.yml).
test.skip(process.env.CI !== 'true', 'Screenshots are only compared in the CI container');

for (const { name, path } of PAGES) {
  for (const theme of THEMES) {
    for (const viewport of VIEWPORTS) {
      test(`@visual ${name} ${theme} ${viewport.width}`, async ({ page }) => {
        // next-themes reads the theme from localStorage key "theme" (ThemeProvider storageKey).
        await page.addInitScript(value => localStorage.setItem('theme', value), theme);
        await page.setViewportSize(viewport);
        await page.goto(path, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);

        // Images and dates come from the CMS; the home page's latest posts change with every publish.
        const mask = [page.locator('img'), page.locator('time')];
        if (name === 'home') mask.push(page.locator('#articles'));

        await expect(page).toHaveScreenshot(`${name}-${theme}-${viewport.width}.png`, {
          fullPage: true,
          animations: 'disabled',
          maxDiffPixelRatio: 0.01,
          mask,
        });
      });
    }
  }
}
