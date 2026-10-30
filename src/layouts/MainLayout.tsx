import { FC, lazy, Suspense } from 'react';
import { Header, Navbar, Footer } from '@components';
import Feature from '@/components/Feature';

// Loaded only while the search feature is on, so they stay out of the initial bundle.
const Menu = lazy(() => import('@/components/Menu'));
const Search = lazy(() => import('@/features/Search'));

const MainLayout: FC<{ children: React.ReactNode }> = ({ children }) => (
  <div id="wrapper">
    <div className="min-h-screen bg-background animate-fade-in">
      <Header>
        <Navbar />
      </Header>
      {/* TODO: add search functionality */}
      <Feature name="search">
        <Suspense fallback={null}>
          <Menu searchBar={<Search />} />
        </Suspense>
      </Feature>
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
