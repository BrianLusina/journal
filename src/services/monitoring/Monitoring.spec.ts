import type { ErrorInfo } from 'react';

// The factory counts how often it runs, so tests can tell whether the Sentry SDK was loaded.
const mockSentryLoads = { count: 0 };
const sentryFactory = () => {
  mockSentryLoads.count += 1;
  return {
    initializeSentry: jest.fn(),
    captureAndLogSentryError: jest.fn(),
    captureSentryException: jest.fn(),
    captureSentryScope: jest.fn(),
  };
};

type Monitoring = typeof import('./Monitoring');
type SentryService = Record<
  'initializeSentry' | 'captureAndLogSentryError' | 'captureSentryException' | 'captureSentryScope',
  jest.Mock
>;

/** Lets the SDK's dynamic import resolve and the queued reports run. */
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

/** Loads Monitoring against the given config in a fresh module registry. */
const loadMonitoring = (isProduction: boolean): Monitoring => {
  jest.doMock('@config', () => ({ __esModule: true, default: { env: { isProduction } } }));
  // A fresh registry needs synchronous requires to load a fresh copy of each module.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./Monitoring');
};

/** The Sentry mock from the current registry, the one the code under test imported. */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sentry = (): SentryService => require('./sentry');

/** Collects the callbacks handed to requestIdleCallback, so a test decides when the browser is idle. */
let idleCallbacks: (() => void)[];
const becomeIdle = () => idleCallbacks.splice(0).forEach(callback => callback());

beforeEach(() => {
  jest.resetModules();
  // Registered per test because a test may replace it with a failing import.
  jest.doMock('./sentry', sentryFactory);
  mockSentryLoads.count = 0;
  idleCallbacks = [];
  window.requestIdleCallback = jest.fn(callback => {
    idleCallbacks.push(callback as () => void);
    return idleCallbacks.length;
  });
});

// Lets Sentry load for a test that left it waiting, so that copy of Monitoring removes its window
// listeners instead of leaving them to hear the next test's events.
afterEach(async () => {
  becomeIdle();
  await flush();
});

describe('Monitoring', () => {
  it('does not load the Sentry SDK when the module is imported', () => {
    loadMonitoring(true);

    expect(mockSentryLoads.count).toBe(0);
  });

  it('loads and initializes Sentry in production once the browser is idle, not before', async () => {
    const monitoring = loadMonitoring(true);

    monitoring.initializeMonitoring();
    await flush();

    expect(mockSentryLoads.count).toBe(0);

    becomeIdle();
    await flush();

    expect(sentry().initializeSentry).toHaveBeenCalledTimes(1);
  });

  it('loads Sentry after a timeout where the browser has no requestIdleCallback', async () => {
    // Safari has no requestIdleCallback.
    delete (window as Partial<Window>).requestIdleCallback;
    const monitoring = loadMonitoring(true);

    monitoring.initializeMonitoring();
    await flush();
    await flush();

    expect(sentry().initializeSentry).toHaveBeenCalledTimes(1);
  });

  it('never loads Sentry outside production', async () => {
    const monitoring = loadMonitoring(false);

    monitoring.initializeMonitoring();
    monitoring.captureException(new Error('boom'));
    becomeIdle();
    await flush();

    expect(mockSentryLoads.count).toBe(0);
  });

  it('keeps errors reported before Sentry loads and sends them, in order, after it initializes', async () => {
    const monitoring = loadMonitoring(true);
    const first = new Error('first');
    const second = new Error('second');
    const errorInfo = { componentStack: 'in Page' } as ErrorInfo;
    const breadcrumb = { type: 'component', data: { component: 'Posts' } };
    const service = sentry();
    service.captureSentryScope.mockReturnValue('sentry-scope');

    monitoring.captureException(first, monitoring.captureScope(breadcrumb), 'Posts failed');
    monitoring.captureAndLogError(second, errorInfo, { location: '/blog' });
    monitoring.initializeMonitoring();
    becomeIdle();

    expect(service.captureSentryException).not.toHaveBeenCalled();

    await flush();

    expect(service.initializeSentry).toHaveBeenCalledTimes(1);
    expect(service.captureSentryScope).toHaveBeenCalledWith(breadcrumb, monitoring.Severity.Error);
    expect(service.captureSentryException).toHaveBeenCalledWith(first, 'sentry-scope', 'Posts failed');
    expect(service.captureAndLogSentryError).toHaveBeenCalledWith(second, errorInfo, { location: '/blog' });
    expect(service.initializeSentry.mock.invocationCallOrder[0]).toBeLessThan(
      service.captureSentryException.mock.invocationCallOrder[0],
    );
    expect(service.captureSentryException.mock.invocationCallOrder[0]).toBeLessThan(
      service.captureAndLogSentryError.mock.invocationCallOrder[0],
    );
  });

  it('sends errors straight to Sentry once it has loaded', async () => {
    const monitoring = loadMonitoring(true);
    monitoring.initializeMonitoring();
    becomeIdle();
    await flush();
    const service = sentry();
    service.captureSentryScope.mockReturnValue('sentry-scope');
    const error = new Error('boom');

    monitoring.captureException(error, monitoring.captureScope({ type: 'component' }));

    expect(service.captureSentryException).toHaveBeenCalledWith(error, 'sentry-scope', 'Error Caught');
  });

  it('drops reports and stops listening, instead of failing or queueing forever, when the Sentry SDK cannot load', async () => {
    jest.doMock('./sentry', () => {
      throw new Error('chunk failed to load');
    });
    const unhandled = jest.fn();
    process.on('unhandledRejection', unhandled);
    const addEventListener = jest.spyOn(window, 'addEventListener');
    const removeEventListener = jest.spyOn(window, 'removeEventListener');
    const monitoring = loadMonitoring(true);

    monitoring.initializeMonitoring();
    becomeIdle();
    await flush();
    monitoring.captureException(new Error('after the failure'));
    await flush();
    process.off('unhandledRejection', unhandled);

    expect(unhandled).not.toHaveBeenCalled();
    expect(addEventListener.mock.calls).toHaveLength(2);
    expect(removeEventListener.mock.calls).toEqual(addEventListener.mock.calls);
    addEventListener.mockRestore();
    removeEventListener.mockRestore();
  });

  it('caps the wait for an idle moment, so a busy page still loads Sentry', () => {
    loadMonitoring(true).initializeMonitoring();

    expect(window.requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), { timeout: 3000 });
  });

  describe('uncaught errors before Sentry loads', () => {
    const MESSAGE = 'Uncaught before monitoring loaded';
    const uncaught = (error?: unknown, message = '') =>
      window.dispatchEvent(new ErrorEvent('error', { error, message }));
    const unhandledRejection = (reason: unknown) =>
      window.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason }));

    it('sends an uncaught error and an unhandled rejection, once each, after Sentry initializes', async () => {
      const monitoring = loadMonitoring(true);
      const service = sentry();
      const thrown = new Error('thrown at startup');
      const rejected = new Error('rejected at startup');

      monitoring.initializeMonitoring();
      uncaught(thrown, thrown.message);
      unhandledRejection(rejected);

      expect(service.captureSentryException).not.toHaveBeenCalled();

      becomeIdle();
      await flush();

      expect(service.captureSentryException.mock.calls).toEqual([
        [thrown, undefined, MESSAGE],
        [rejected, undefined, MESSAGE],
      ]);
      expect(service.initializeSentry.mock.invocationCallOrder[0]).toBeLessThan(
        service.captureSentryException.mock.invocationCallOrder[0],
      );
    });

    it('stops listening once Sentry has initialized, so its own handlers report without duplicates', async () => {
      const monitoring = loadMonitoring(true);
      const service = sentry();

      monitoring.initializeMonitoring();
      becomeIdle();
      await flush();
      // Without an error object, so jsdom does not rethrow it into the test once no listener is left.
      uncaught(undefined, 'after init');
      unhandledRejection(new Error('after init'));

      expect(service.captureSentryException).not.toHaveBeenCalled();
    });

    it('wraps values that are not errors', async () => {
      const monitoring = loadMonitoring(true);
      const service = sentry();

      monitoring.initializeMonitoring();
      uncaught(undefined, 'Script error.');
      unhandledRejection('not an error');
      becomeIdle();
      await flush();

      const errors = service.captureSentryException.mock.calls.map(([error]) => error);
      expect(errors).toEqual([new Error('Script error.'), new Error('not an error')]);
      expect(errors.every(error => error instanceof Error)).toBe(true);
    });

    it('does not listen outside production', () => {
      const addEventListener = jest.spyOn(window, 'addEventListener');
      const monitoring = loadMonitoring(false);

      monitoring.initializeMonitoring();
      // Without an error object, so jsdom does not rethrow it into the test when no listener exists.
      uncaught(undefined, 'boom');

      expect(addEventListener).not.toHaveBeenCalled();
      expect(mockSentryLoads.count).toBe(0);
      addEventListener.mockRestore();
    });

  });

  it('describes a scope without loading Sentry', () => {
    const monitoring = loadMonitoring(true);

    const scope = monitoring.captureScope({ type: 'component' }, monitoring.Severity.Warning);

    expect(scope).toEqual({ breadcrumb: { type: 'component' }, level: 'warning' });
    expect(mockSentryLoads.count).toBe(0);
  });
});
