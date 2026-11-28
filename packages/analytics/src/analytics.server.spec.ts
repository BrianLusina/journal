// @vitest-environment node
import { createAnalytics } from './analytics';

// Astro renders an island on the server before it hydrates, and the server has no `window`.
describe('createAnalytics on the server', () => {
  it('can be created, and called before consent, where there is no window', () => {
    expect(typeof globalThis.window).toBe('undefined');

    const analytics = createAnalytics({ site: 'home', isProduction: true, measurementId: 'G-TEST' });
    analytics.pageview('/');
    analytics.event({ name: 'resume_download' });
  });
});
