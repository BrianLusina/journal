import { FunctionComponent } from 'react';
import Header from '@components/Header';
import Menu from '@components/Menu';
import Sidebar from '@components/Sidebar';
import Intro from '@components/Intro';
import Footer from '@components/Footer';
import SocialCard from '@components/SocialCard';
import MiniPosts from '@components/MiniPost';
import Blurb from '@components/Blurb';

const MainLayout: FunctionComponent = ({ children }) => (
  <div id="wrapper">
    <Header />
    <Menu />
    <div id="main">{children}</div>
    <Sidebar>
      <Intro />
      <MiniPosts posts={miniPosts} currentTag={tag} />
      <Blurb />
      <SocialCard />
      <Footer />
    </Sidebar>
  </div>
);

export default MainLayout;
