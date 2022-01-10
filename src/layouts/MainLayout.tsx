import { FunctionComponent } from 'react';
import Header from '@components/Header';
import Navbar from '@components/Navbar';
import Search from '@features/Search';
import Menu from '@components/Menu';
import Sidebar from '@components/Sidebar';
import Intro from '@components/Intro';
import Footer from '@components/Footer';
import MiniPosts from '@features/MiniPosts';
import Social from '@features/Social';
import AboutBlurb from '@features/AboutBlurb';

const MainLayout: FunctionComponent = ({ children }) => (
  <div id="wrapper">
    <Header>
      <Navbar />
      <nav className="main">
        <ul>
          <li className="header-search">
            <Search className="visible" />
          </li>
          <li className="menu">
            <a className="fa-bars" href="#menu">
              Menu
            </a>
          </li>
        </ul>
      </nav>
    </Header>
    <Menu searchBar={<Search className="visible" />} />
    <div id="main">{children}</div>
    <Sidebar>
      <Intro />
      <MiniPosts />
      <AboutBlurb />
      <Social />
      <Footer />
    </Sidebar>
  </div>
);

export default MainLayout;
