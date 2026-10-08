jest.mock('firebase/analytics', () => ({ getAnalytics: jest.fn(() => 'firebase-analytics'), logEvent: jest.fn() }));
jest.mock('@firebaseClient', () => ({ __esModule: true, default: 'firebase-app' }));

/**
 * Loads Analytics against the given config in a fresh module registry, returning the Firebase
 * mocks from that same registry so assertions observe the instance the code under test used.
 */
const loadAnalytics = (isProduction: boolean, projectId: string) => {
  jest.doMock('@config', () => ({ __esModule: true, default: { env: { isProduction }, firebase: { projectId } } }));
  let loaded = {} as { analytics: { logEvent: (name: string, params?: object) => void }; firebase: typeof import('firebase/analytics') };
  jest.isolateModules(() => {
    // isolateModules needs synchronous requires to load a fresh copy of each module.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    loaded = { analytics: require('./Analytics').default, firebase: require('firebase/analytics') };
  });
  (loaded.firebase.getAnalytics as jest.Mock).mockReturnValue('firebase-analytics');
  return loaded;
};

describe('Analytics', () => {
  it('does not touch Firebase when the module is imported', () => {
    const { firebase } = loadAnalytics(true, 'project');

    expect(firebase.getAnalytics).not.toHaveBeenCalled();
  });

  it('logs events in production when Firebase is configured', () => {
    const { analytics, firebase } = loadAnalytics(true, 'project');

    analytics.logEvent('page_view', { page_path: '/' });

    expect(firebase.getAnalytics).toHaveBeenCalledWith('firebase-app');
    expect(firebase.logEvent).toHaveBeenCalledWith('firebase-analytics', 'page_view', { page_path: '/' });
  });

  it('skips events outside production', () => {
    const { analytics, firebase } = loadAnalytics(false, 'project');

    analytics.logEvent('page_view');

    expect(firebase.getAnalytics).not.toHaveBeenCalled();
    expect(firebase.logEvent).not.toHaveBeenCalled();
  });

  it('skips events when Firebase is not configured instead of crashing the app', () => {
    const { analytics, firebase } = loadAnalytics(true, '');

    analytics.logEvent('page_view');

    expect(firebase.getAnalytics).not.toHaveBeenCalled();
    expect(firebase.logEvent).not.toHaveBeenCalled();
  });
});
