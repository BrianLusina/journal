import type { Mock } from 'vitest';
// The factories count how often they run, so tests can tell whether the Firebase SDK was loaded.
const mockSdkLoads = { analytics: 0, app: 0 };
vi.mock('firebase/analytics', () => {
  mockSdkLoads.analytics += 1;
  return { initializeAnalytics: vi.fn(), logEvent: vi.fn() };
});
vi.mock('@firebaseClient', () => {
  mockSdkLoads.app += 1;
  return { __esModule: true, default: 'firebase-app' };
});

type FirebaseAnalytics = { initializeAnalytics: Mock; logEvent: Mock };

/** Lets the SDK's dynamic import resolve and the queued events run. */
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

/** Loads Analytics against the given config in a fresh module registry. */
const loadAnalytics = async (isProduction: boolean, projectId: string) => {
  vi.doMock('@config', () => ({ __esModule: true, default: { env: { isProduction }, firebase: { projectId } } }));
  return (await import('./Analytics')).default as { logEvent: (name: string, params?: object) => void };
};

/** The Firebase mock from the current registry, the one the code under test imported. */
const firebase = async (): Promise<FirebaseAnalytics> => {
  const sdk = (await import('firebase/analytics')) as unknown as FirebaseAnalytics;
  sdk.initializeAnalytics.mockReturnValue('firebase-analytics');
  return sdk;
};

beforeEach(() => {
  vi.resetModules();
  mockSdkLoads.analytics = 0;
  mockSdkLoads.app = 0;
});

describe('Analytics', () => {
  it('does not load the Firebase SDK when the module is imported', async () => {
    await loadAnalytics(true, 'project');

    expect(mockSdkLoads).toEqual({ analytics: 0, app: 0 });
  });

  it('logs events in production when Firebase is configured, once the SDK has loaded', async () => {
    const analytics = await loadAnalytics(true, 'project');
    const sdk = await firebase();

    analytics.logEvent('page_view', { page_path: '/' });
    await flush();

    // Page views are logged by usePageViews, so Firebase's own (with the full URL) is turned off.
    expect(sdk.initializeAnalytics).toHaveBeenCalledWith('firebase-app', { config: { send_page_view: false } });
    expect(sdk.logEvent).toHaveBeenCalledWith('firebase-analytics', 'page_view', {
      page_location: 'http://localhost/',
      page_path: '/',
    });
  });

  it('keeps events logged before the SDK loads and sends them in order once it has', async () => {
    const analytics = await loadAnalytics(true, 'project');
    const sdk = await firebase();

    analytics.logEvent('page_view', { page_path: '/' });
    analytics.logEvent('page_view', { page_path: '/about' });

    expect(sdk.logEvent).not.toHaveBeenCalled();

    await flush();

    expect(sdk.logEvent.mock.calls).toEqual([
      ['firebase-analytics', 'page_view', { page_location: 'http://localhost/', page_path: '/' }],
      ['firebase-analytics', 'page_view', { page_location: 'http://localhost/', page_path: '/about' }],
    ]);
    expect(sdk.initializeAnalytics).toHaveBeenCalledTimes(1);
  });

  it('sends the page URL without the search query, which can hold anything a reader types', async () => {
    window.history.replaceState(null, '', '/search?q=ada%40example.com&utm_source=mail');
    const analytics = await loadAnalytics(true, 'project');
    const sdk = await firebase();

    analytics.logEvent('search', { search_term: 'react' });
    window.history.replaceState(null, '', '/');
    await flush();

    expect(sdk.logEvent).toHaveBeenCalledWith('firebase-analytics', 'search', {
      page_location: 'http://localhost/search?utm_source=mail',
      search_term: 'react',
    });
  });

  it('drops events quietly when the SDK cannot load, since analytics must not break the page', async () => {
    vi.doMock('firebase/analytics', () => {
      throw new Error('chunk failed to load');
    });
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    const analytics = await loadAnalytics(true, 'project');

    analytics.logEvent('page_view');
    analytics.logEvent('page_view');
    await flush();
    await flush();
    process.off('unhandledRejection', unhandled);

    expect(unhandled).not.toHaveBeenCalled();
  });

  it('skips events outside production without loading the SDK', async () => {
    const analytics = await loadAnalytics(false, 'project');

    analytics.logEvent('page_view');
    await flush();

    expect(mockSdkLoads).toEqual({ analytics: 0, app: 0 });
  });

  it('skips events when Firebase is not configured instead of crashing the app', async () => {
    const analytics = await loadAnalytics(true, '');

    analytics.logEvent('page_view');
    await flush();

    expect(mockSdkLoads).toEqual({ analytics: 0, app: 0 });
  });
});
