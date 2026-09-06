import {
  isValidElement,
  Component,
  ErrorInfo,
  ReactNode,
} from 'react';
import { captureAndLogError } from '@monitoring';
import { changedArray } from '@utils';
import { ErrorBoundaryState, ErrorBoundaryProps } from './ErrorBoundary.props';

/**
 * A reusable error boundary component for handling errors in a React application (sub)tree.
 * This borrows ideas from the react-error-boundary package and aims to be extensible and re-useable across different components
 * Errors will be reported to a monitoring service.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      error: null,
    };
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps, prevState: ErrorBoundaryState): void {
    const { error } = this.state;
    const { resetKeys, onResetKeysChange } = this.props;

    // There's an edge case where if the thing that triggered the error
    // happens to *also* be in the resetKeys array, we'd end up resetting
    // the error boundary immediately. This would likely trigger a second
    // error to be thrown.
    // So we make sure that we don't check the resetKeys on the first call
    // of cDU after the error is set

    if (
      error !== null &&
      prevState.error !== null &&
      changedArray(prevProps.resetKeys, resetKeys)
    ) {
      onResetKeysChange?.(prevProps.resetKeys, resetKeys);
      this.reset();
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError } = this.props;
    if (onError) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      onError(error, errorInfo);
    } else {
      captureAndLogError(error, errorInfo);
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      error,
    };
  }

  resetErrorBoundary = (...args: unknown[]): void => {
    const { onReset } = this.props;
    onReset?.(...args);
    this.reset();
  };

  reset(): void {
    this.setState({ error: null });
  }

  render(): ReactNode {
    const { 
      title = 'Oops! Well, this is embarrassing...',
      message = 'Something terrible went wrong and I feel terrible that you had to experience this! <b /> My little bots are working to fix this.',
      children, 
      FallbackComponent, 
      fallback
    } = this.props;
    const { error } = this.state;

    if (error) {
      const props = {
        error,
        resetErrorBoundary: this.resetErrorBoundary,
      };

      if (isValidElement(fallback)) {
        return fallback;
      }
      if (FallbackComponent) {
        return <FallbackComponent {...props} />;
      }
      <div>
        <h1 className="font-sans font-medium text-4xl text-center text-[#181818]">{title}</h1>
        <p className="font-sans font-medium text-base text-center text-[#181818] my-[0.1em]">{message}</p>
      </div>
    }
    return children;
  }
}
