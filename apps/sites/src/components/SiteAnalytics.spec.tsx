// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createAnalytics } from '@brianlusina/analytics';
import { SiteAnalytics } from './SiteAnalytics';

const analytics = { grant: vi.fn(), pageview: vi.fn(), event: vi.fn() };
vi.mock('@brianlusina/analytics', () => ({ createAnalytics: vi.fn(() => analytics) }));

let cookie = '';
beforeEach(() => {
  cookie = '';
  vi.mocked(createAnalytics).mockClear();
  Object.values(analytics).forEach(fn => fn.mockClear());
  Object.defineProperty(document, 'cookie', { configurable: true, get: () => cookie, set: () => undefined });
  window.history.replaceState({}, '', '/projects');
});

const props = { site: 'folio' as const, isProduction: true, measurementId: 'G-TEST' };

describe('SiteAnalytics', () => {
  it('creates the analytics for the site and asks for consent', () => {
    render(<SiteAnalytics {...props} />);

    expect(createAnalytics).toHaveBeenCalledWith(props);
    expect(screen.getByRole('region', { name: 'Cookie consent' })).toBeInTheDocument();
    expect(analytics.grant).not.toHaveBeenCalled();
  });

  it('grants, then sends a page view for the current path, once the reader accepts', () => {
    render(<SiteAnalytics {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(analytics.grant).toHaveBeenCalledTimes(1);
    expect(analytics.pageview).toHaveBeenCalledWith('/projects');
    expect(analytics.grant.mock.invocationCallOrder[0]).toBeLessThan(analytics.pageview.mock.invocationCallOrder[0]);
  });

  it('grants on load, without asking, when the reader accepted before', () => {
    cookie = 'consent=granted';
    render(<SiteAnalytics {...props} />);

    expect(screen.queryByRole('region', { name: 'Cookie consent' })).not.toBeInTheDocument();
    expect(analytics.grant).toHaveBeenCalledTimes(1);
    expect(analytics.pageview).toHaveBeenCalledWith('/projects');
  });
});
