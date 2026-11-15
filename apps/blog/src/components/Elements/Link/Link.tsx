import { Link as RouterLink, LinkProps } from 'react-router-dom';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const Link = ({ className, children, ...props }: LinkProps) => {
  return (
    <RouterLink className={className || ''} {...props}>
      {children}
    </RouterLink>
  );
};

export default Link;
