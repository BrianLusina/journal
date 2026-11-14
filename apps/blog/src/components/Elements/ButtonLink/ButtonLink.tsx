import { FunctionComponent } from 'react';
import { Link } from 'react-router-dom';
import { ButtonLinkProps } from './ButtonLink.types';

const ButtonLink: FunctionComponent<ButtonLinkProps> = ({ path, text, className }) => (
  <Link to={path} className={`button large ${className || ''}`}>
    {text}
  </Link>
);

export default ButtonLink;
