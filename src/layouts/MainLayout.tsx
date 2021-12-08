import { FunctionComponent } from 'react';
import Header from '@components/Header';
import Menu from '@components/Menu';
import Sidebar from '@components/Sidebar';

const MainLayout: FunctionComponent = ({ children }) => (
  <div id="wrapper">
    <Header />
    <Menu />
    <div id="main">{children}</div>
    <Sidebar
      miniPosts={miniPosts}
      about={about}
      socialLinks={socialLinks}
      contact={{
        town,
        country,
        email,
        emailAlias,
      }}
      pageDesc={description}
      tag={tag}
    />
  </div>
);

export default MainLayout;
