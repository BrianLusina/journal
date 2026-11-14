import { FunctionComponent } from 'react';
import { HeaderProps } from './Header.types';
// import './header.scss';

const Header: FunctionComponent<HeaderProps> = ({ children }) => {
  return (
    <header className="sticky top-0 z-50 py-2 sm:py-4 flex justify-between items-center px-4">
      {children}
    </header>
  );
};

export default Header;
