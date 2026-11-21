import { createContext, useContext, type ComponentType, type FC, type MouseEventHandler, type ReactNode } from 'react';

export type LinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  'aria-label'?: string;
};

const Anchor: FC<LinkProps> = ({ href, children, ...props }) => (
  <a href={href} {...props}>
    {children}
  </a>
);

const LinkContext = createContext<ComponentType<LinkProps>>(Anchor);

/**
 * Lets an app with a client-side router render every link in this package through its own link
 * component (the blog passes React Router's). Without one, links are plain anchors, which is what
 * Astro pages want.
 */
export const LinkProvider: FC<{ component: ComponentType<LinkProps>; children: ReactNode }> = ({ component, children }) => (
  <LinkContext.Provider value={component}>{children}</LinkContext.Provider>
);

export const Link: FC<LinkProps> = props => {
  const Component = useContext(LinkContext);
  return <Component {...props} />;
};
