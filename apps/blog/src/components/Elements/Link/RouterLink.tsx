import { Link as ReactRouterLink } from 'react-router-dom';
import type { LinkProps } from '@brianlusina/ui';

/** Renders @brianlusina/ui's links through React Router, so the blog navigates without reloading. */
const RouterLink = ({ href, ...props }: LinkProps) => <ReactRouterLink to={href} {...props} />;

export default RouterLink;
