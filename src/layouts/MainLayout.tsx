import { FunctionComponent } from 'react';
import Header from '@components/Header';
import Navbar from '@components/Navbar';
import Search from '@/features/Search';
import Menu from '@components/Menu';
import Sidebar from '@components/Sidebar';
import Intro from '@components/Intro';
import Footer from '@components/Footer';
import MiniPosts from '@/features/MiniPosts';
import Social from '@/features/Social';
import AboutBlurb from '@/features/AboutBlurb';

const MainLayout: FunctionComponent = ({ children }) => (
  <div id="wrapper">
    <div className="min-h-screen bg-background animate-fade-in">
      <Header>
        <Navbar />
        {/* <nav className="main">
          <ul>
            <li className="header-search">
              <Search />
            </li>
            <li className="menu">
              <a className="fa-bars" href="#menu">
                Menu
              </a>
            </li>
          </ul>
        </nav> */}
      </Header>
      <Menu searchBar={<Search />} />
      <main id="main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      <Footer />
      <Sidebar>
        <Intro />
        <MiniPosts />
        <AboutBlurb />
        <Social />
      </Sidebar>
    </div>
  </div>
);

export default MainLayout;
