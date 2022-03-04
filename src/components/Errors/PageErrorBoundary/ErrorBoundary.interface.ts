import {
  ReactChildren,
  FunctionComponent,
  ReactElement,
  ReactNode,
  ComponentType,
  Component,
} from 'react';

interface FallbackProps {
  error: Error;
  resetErrorBoundary: (...e: Array<unknown>) => void;
}

export type ErrorBoundaryProps = {
  children: ReactChildren | ReactElement | ReactNode;

  fallback?: ReactElement<unknown, string | FunctionComponent | typeof Component> | null;

  /**
   * Fallback Component to render when there is an error
   */
  FallbackComponent?: ComponentType<FallbackProps>;

  /**
   * Callback to reset the error state
   * @param {Array} e  of arguments
   * @returns {void}
   */
  onReset?: (...e: unknown[]) => void;

  /**
   * Callback to call when an error is encountered
   * @param {Error} e Error object
   * @param {Object} info Error information
   */
  // eslint-disable-next-line no-unused-vars
  onError?: (e: Error, info: { componentStack: string }) => void;

  /**
   * Array or reset keys used to reset the error state
   */
  resetKeys?: unknown[];

  /**
   * Callback to handle reset keys
   * Passees in previous reset keys and reset keys that will perform an equality
   * check to determine if the reset keys have changed and reset the error
   */
  onResetKeysChange?: (
    // eslint-disable-next-line no-unused-vars
    prevResetKeys: unknown[] | undefined,
    // eslint-disable-next-line no-unused-vars
    resetKeys: unknown[] | undefined,
  ) => void;
};

export type ErrorBoundaryState = {
  error: Error | null;
};
