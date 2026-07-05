/**
 * Custom Monitoring Service. This can be extended to capture logs/errors in application.
 * This should ideally not be used for analytics/metrics. These can be handled separately.
 *
 * Here Sentry can be used.
 * Or LogRocket can be used.
 * Or a custom Logger Service can be used.
 * or all of them combined
 */

import { ErrorInfo } from 'react';
import config from '@config';
import {
  initializeSentry,
  captureAndLogSentryError,
  captureSentryException,
  captureSentryScope,
  Severity,
  SentryBreadcrumb,
  SentryScope,
} from './sentry';

const {
  env: { isProduction },
} = config;

/**
 * Initializes monitoring service
 */
export const initializeMonitoring = (): void => {
  if (isProduction) {
    initializeSentry();
  }
};

/**
 * capture and log any errors caught
 * @param error error in stacktrace
 * @param errorInfo Error information from React
 */
export const captureAndLogError = (error: Error, errorInfo: ErrorInfo): void => {
  if (isProduction) {
    captureAndLogSentryError(error, errorInfo);
  }
};

/**
 * Capture exception
 * @param {Error} error Error context
 */
export const captureException = (
  error: Error,
  scope?: SentryScope,
  errorMessage = 'Error Caught',
): void => {
  if (isProduction) {
    captureSentryException(error, scope, errorMessage);
  }
};

export const captureScope = (
  data: SentryBreadcrumb,
  level: Severity = Severity.Error,
): SentryScope => {
  return captureSentryScope(data, level);
};

export type BreadCrumb = SentryBreadcrumb;
export { Severity };
