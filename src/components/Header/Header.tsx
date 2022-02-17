import { FunctionComponent } from 'react';
import { Link } from 'react-router-dom';
import config from '@config';
import { HeaderProps } from './Header.types';
import './header.scss';

const Header: FunctionComponent<HeaderProps> = ({ title = config.title, children }) => {
  return (
    <header id="header">
      <h1>
        <Link to="/">{title}</Link>
      </h1>
      {children}
    </header>
  );
};

export default Header;
