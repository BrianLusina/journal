import { FunctionComponent, ReactChildren, ReactNode, ReactElement } from 'react';
import { render as rtlRender } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockApp from './MockApp';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function render(ui: ReactElement, { ...options } = {}) {
  type WrapperProps = { children?: ReactNode | ReactChildren };

  const Wrapper: FunctionComponent = ({ children }: WrapperProps) => {
    return <MockApp>{children}</MockApp>;
  };

  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

export * from '@testing-library/react';
// override the built-in render with our own
export { render, userEvent };
