import { FunctionComponent } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

/**
 * Returns a Mock application wrapped in Router only
 * @param {MockAppProps} props to pass in
 * @returns Router Application
 */
const MockAppWithRouter: FunctionComponent = ({ children }) => {
  return <Router>{children}</Router>;
};

export default MockAppWithRouter;
