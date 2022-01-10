import { FunctionComponent, ReactChildren, ReactNode } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

type MockAppRouterProps = {
  children?: ReactNode | ReactChildren;
};

/**
 * Returns a Mock application wrapped in Router only
 * @param {MockAppProps} props to pass in
 * @returns Router Application
 */
const MockAppWithRouter: FunctionComponent<MockAppRouterProps> = ({
  children,
}: MockAppRouterProps) => {
  return <Router>{children}</Router>;
};

export default MockAppWithRouter;
