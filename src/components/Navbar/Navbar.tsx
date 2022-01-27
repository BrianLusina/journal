import { FunctionComponent } from 'react';
import { Link } from 'react-router-dom';
import navbarItems from './constants';
import './navbar.scss';

const Navbar: FunctionComponent = () => (
  <nav className="links">
    <ul>
      {navbarItems.map(({ name, path }) => (
        <li key={name}>
          <Link to={path}>{name}</Link>
        </li>
      ))}
    </ul>
  </nav>
);

export default Navbar;
