import { FunctionComponent } from 'react';
import { Link } from 'react-router-dom';
import { ButtonLinkProps } from './ButtonLink.types';

const ButtonLink: FunctionComponent<ButtonLinkProps> = ({ path, text }) => (
  <Link to={path} className="button large">
    {text}
  </Link>
);

export default ButtonLink;
