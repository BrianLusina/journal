import { FunctionComponent, ReactNode, ReactElement } from 'react';
import { render as rtlRender } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockApp from './MockApp';

function render(ui: ReactElement, { ...options } = {}) {
  type WrapperProps = { children?: ReactNode };

  const Wrapper: FunctionComponent = ({ children }: WrapperProps) => {
    return <MockApp>{children}</MockApp>;
  };

  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

export * from '@testing-library/react';
// override the built-in render with our own
export { render, userEvent };
