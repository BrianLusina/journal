import { FunctionComponent } from 'react';
import { Link } from 'react-router-dom';
import { MenuItemProps } from './MenuItem.types';

const MenuItem: FunctionComponent<MenuItemProps> = ({ link, title, description }) => {
  return (
    <Link to={link}>
      <h3>{title}</h3>
      <p>{description}</p>
    </Link>
  );
};

export default MenuItem;
