import { FC } from 'react';
import { Header, Navbar, Footer } from '@components';

const MainLayout: FC<{ children: React.ReactNode }> = ({ children }) => (
  <div id="wrapper">
    <div className="min-h-screen bg-background animate-fade-in">
      <Header>
        <Navbar />
      </Header>
      <main id="main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
      {/*
      <Sidebar>
        <MiniPosts />
        <AboutBlurb />
        <Social />
      </Sidebar> */}
    </div>
  </div>
);

export default MainLayout;
