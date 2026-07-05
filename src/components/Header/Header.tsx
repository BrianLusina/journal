import { FunctionComponent } from 'react';
import config from '@config';
import { HeaderProps } from './Header.types';
// import './header.scss';

const Header: FunctionComponent<HeaderProps> = ({ title = config.title, children }) => {
  return (
    <header className="sticky top-0 z-50 py-2 sm:py-4 flex justify-between items-center px-4">
      <h1 className="text-xl font-bold">
        <a href="/" className="hover:text-primary transition-colors">{title}</a>
      </h1>
      {children}
    </header>
  );
};

export default Header;
