import { FunctionComponent } from 'react';
import Header from '@components/Header';
import Menu from '@components/Menu';
import Sidebar from '@components/Sidebar';
import Intro from '@components/Intro';
import Footer from '@components/Footer';
import Contact from '@components/Contact';
import MiniPosts from '@components/MiniPost';
import AboutBlurb from '@components/AboutBlurb';

const MainLayout: FunctionComponent = ({ children }) => (
  <div id="wrapper">
    <Header />
    <Menu />
    <div id="main">{children}</div>
    <Sidebar>
      <Intro />
      <MiniPosts posts={miniPosts} currentTag={tag} />
      <AboutBlurb about={about} />
      <Contact town={town} country={country} email={email} emailAlias={emailAlias} />
      <Footer socialLinks={socialLinks} />
    </Sidebar>
  </div>
);

export default MainLayout;
