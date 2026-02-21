import { FunctionComponent } from 'react';
import config from '@config';
import { HeaderProps } from './Header.types';
// import './header.scss';

const Header: FunctionComponent<HeaderProps> = ({ title = config.title, children }) => {
  return (
    <header className="sticky top-0 z-50 py-2 sm:py-4">
      {children}
    </header>
  );
};

export default Header;
