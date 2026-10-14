import { FunctionComponent, PropsWithChildren } from 'react';

const Sidebar: FunctionComponent<PropsWithChildren> = ({ children }) => (
  <section id="sidebar">{children}</section>
);

export default Sidebar;
