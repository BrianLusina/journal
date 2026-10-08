// The factories count how often they run, so tests can tell whether the Firebase SDK was loaded.
const mockSdkLoads = { analytics: 0, app: 0 };
jest.mock('firebase/analytics', () => {
  mockSdkLoads.analytics += 1;
  return { getAnalytics: jest.fn(), logEvent: jest.fn() };
});
jest.mock('@firebaseClient', () => {
  mockSdkLoads.app += 1;
  return { __esModule: true, default: 'firebase-app' };
});

type FirebaseAnalytics = { getAnalytics: jest.Mock; logEvent: jest.Mock };

/** Lets the SDK's dynamic import resolve and the queued events run. */
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

/** Loads Analytics against the given config in a fresh module registry. */
const loadAnalytics = (isProduction: boolean, projectId: string) => {
  jest.doMock('@config', () => ({ __esModule: true, default: { env: { isProduction }, firebase: { projectId } } }));
  // A fresh registry needs synchronous requires to load a fresh copy of each module.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./Analytics').default as { logEvent: (name: string, params?: object) => void };
};

/** The Firebase mock from the current registry, the one the code under test imported. */
const firebase = (): FirebaseAnalytics => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sdk = require('firebase/analytics') as FirebaseAnalytics;
  sdk.getAnalytics.mockReturnValue('firebase-analytics');
  return sdk;
};

beforeEach(() => {
  jest.resetModules();
  mockSdkLoads.analytics = 0;
  mockSdkLoads.app = 0;
});

describe('Analytics', () => {
  it('does not load the Firebase SDK when the module is imported', () => {
    loadAnalytics(true, 'project');

    expect(mockSdkLoads).toEqual({ analytics: 0, app: 0 });
  });

  it('logs events in production when Firebase is configured, once the SDK has loaded', async () => {
    const analytics = loadAnalytics(true, 'project');
    const sdk = firebase();

    analytics.logEvent('page_view', { page_path: '/' });
    await flush();

    expect(sdk.getAnalytics).toHaveBeenCalledWith('firebase-app');
    expect(sdk.logEvent).toHaveBeenCalledWith('firebase-analytics', 'page_view', { page_path: '/' });
  });

  it('keeps events logged before the SDK loads and sends them in order once it has', async () => {
    const analytics = loadAnalytics(true, 'project');
    const sdk = firebase();

    analytics.logEvent('page_view', { page_path: '/' });
    analytics.logEvent('page_view', { page_path: '/about' });

    expect(sdk.logEvent).not.toHaveBeenCalled();

    await flush();

    expect(sdk.logEvent.mock.calls).toEqual([
      ['firebase-analytics', 'page_view', { page_path: '/' }],
      ['firebase-analytics', 'page_view', { page_path: '/about' }],
    ]);
    expect(sdk.getAnalytics).toHaveBeenCalledTimes(1);
  });

  it('skips events outside production without loading the SDK', async () => {
    const analytics = loadAnalytics(false, 'project');

    analytics.logEvent('page_view');
    await flush();

    expect(mockSdkLoads).toEqual({ analytics: 0, app: 0 });
  });

  it('skips events when Firebase is not configured instead of crashing the app', async () => {
    const analytics = loadAnalytics(true, '');

    analytics.logEvent('page_view');
    await flush();

    expect(mockSdkLoads).toEqual({ analytics: 0, app: 0 });
  });
});
