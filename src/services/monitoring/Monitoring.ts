import { ErrorInfo } from 'react';
import {
  initializeSentry,
  captureAndLogSentryError,
  captureSentryException,
  captureSentryScope,
  Severity,
  SentryBreadcrumb,
  SentryScope,
} from './sentry';
import { inititializeBugSnag, captureBugSnagError } from './bugsnag';

/**
 * Initializes monitoring service
 */
export const initializeMonitoring = (): void => {
  initializeSentry();
  inititializeBugSnag();
};

/**
 * capture and log any errors caught
 * @param error error in stacktrace
 * @param errorInfo Error information from React
 */
export const captureAndLogError = (error: Error, errorInfo: ErrorInfo): void => {
  captureAndLogSentryError(error, errorInfo);
  captureBugSnagError(error);
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
  captureSentryException(error, scope, errorMessage);
  captureBugSnagError(error);
};

export const captureScope = (
  data: SentryBreadcrumb,
  level: Severity = Severity.Error,
): SentryScope => {
  return captureSentryScope(data, level);
};

export type BreadCrumb = SentryBreadcrumb;
export { Severity };
