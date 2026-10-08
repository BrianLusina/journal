/**
 * Custom Monitoring Service. This can be extended to capture logs/errors in application.
 * This should ideally not be used for analytics/metrics. These can be handled separately.
 *
 * Here Sentry can be used.
 * Or LogRocket can be used.
 * Or a custom Logger Service can be used.
 * or all of them combined
 */

import type { ErrorInfo } from 'react';
import config from '@config';
import type { SentryBreadcrumb } from './sentry';

const {
  env: { isProduction },
} = config;

/**
 * Event levels, named as Sentry names them, defined here so that reporting an error does not
 * load the Sentry SDK.
 */
export enum Severity {
  Fatal = 'fatal',
  Error = 'error',
  Warning = 'warning',
  Log = 'log',
  Info = 'info',
  Debug = 'debug',
  Critical = 'critical',
}

/**
 * What to attach to a reported error. It becomes a Sentry scope once Sentry has loaded.
 */
export type MonitoringScope = { breadcrumb: SentryBreadcrumb; level: Severity };

type SentryService = typeof import('./sentry');

let sentry: SentryService | undefined;
// Reports made before Sentry has loaded, sent once it has. Null once Sentry failed to load.
let pending: ((service: SentryService) => void)[] | null = [];

const report = (send: (service: SentryService) => void): void => {
  if (!isProduction) {
    return;
  }
  if (sentry) {
    send(sentry);
  } else {
    pending?.push(send);
  }
};

// Safari has no requestIdleCallback; a timeout still runs after the current render.
const whenIdle = (callback: () => void): void => {
  if ('requestIdleCallback' in window) {
    // The timeout bounds the wait on a page that is never idle.
    window.requestIdleCallback(callback, { timeout: 3000 });
  } else {
    setTimeout(callback);
  }
};

/**
 * Initializes monitoring service. The Sentry SDK is loaded once the browser is idle, so that it
 * does not delay the first paint. Errors reported before then are kept and sent once it has loaded.
 */
export const initializeMonitoring = (): void => {
  if (!isProduction) {
    return;
  }
  whenIdle(() => {
    import('./sentry')
      .then(service => {
        service.initializeSentry();
        sentry = service;
        pending?.forEach(send => send(service));
        pending = [];
      })
      .catch(() => {
        // Without Sentry there is nowhere to report to, so stop keeping reports for it.
        pending = null;
      });
  });
};

/**
 * capture and log any errors caught
 * @param error error in stacktrace
 * @param errorInfo Error information from React
 * @param tags tags to index the error by
 */
export const captureAndLogError = (
  error: Error,
  errorInfo: ErrorInfo,
  tags?: Record<string, string>,
): void => {
  report(service => service.captureAndLogSentryError(error, errorInfo, tags));
};

/**
 * Capture exception
 * @param {Error} error Error context
 */
export const captureException = (
  error: Error,
  scope?: MonitoringScope,
  errorMessage = 'Error Caught',
): void => {
  report(service =>
    service.captureSentryException(
      error,
      scope && service.captureSentryScope(scope.breadcrumb, scope.level),
      errorMessage,
    ),
  );
};

export const captureScope = (
  data: SentryBreadcrumb,
  level: Severity = Severity.Error,
): MonitoringScope => ({ breadcrumb: data, level });

export type BreadCrumb = SentryBreadcrumb;
