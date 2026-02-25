import { Suspense, FunctionComponent, lazy } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { Routes, Route, useLocation } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import usePageViews from '@/hooks/analytics/usePageView';
import RouteErrorBoundary from '@/components/Errors/RouteErrorBoundary';
import PageLoader from '@/components/Elements/Loaders/PageLoader';
import ScrollToTop from '@/components/ScrollToTop';

const Posts = lazy(() => import('@/features/Posts'));
const ArticlePage = lazy(() => import('@/pages/Article'));
const HomePage = lazy(() => import('@/pages/Home'));
const ContactPage = lazy(() => import('@/pages/Contact'));
const AboutPage = lazy(() => import('@/pages/About'));
const AuthorsPage = lazy(() => import('@/pages/Authors'));
const PrivacyPage = lazy(() => import('@/pages/Privacy'));
const TermsPage = lazy(() => import('@/pages/Terms'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const App: FunctionComponent = () => {
  const location = useLocation();
  usePageViews();

  return (
    <MainLayout>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <TransitionGroup>
          <CSSTransition key={location.pathname} classNames="fade" timeout={300}>
            <Routes location={location}>
              <Route
                path="/"
                element={
                  <RouteErrorBoundary location="/">
                    <HomePage />
                  </RouteErrorBoundary>
                }
              />
              <Route
                path="/contact"
                element={
                  <RouteErrorBoundary location="/contact">
                    <ContactPage />
                  </RouteErrorBoundary>
                }
              />
              <Route
                path="/about"
                element={
                  <RouteErrorBoundary location="/about">
                    <AboutPage />
                  </RouteErrorBoundary>
                }
              />
              <Route
                path="/authors"
                element={
                  <RouteErrorBoundary location="/authors">
                    <AuthorsPage />
                  </RouteErrorBoundary>
                }
              />
              <Route
                path="/privacy"
                element={
                  <RouteErrorBoundary location="/privacy">
                    <PrivacyPage />
                  </RouteErrorBoundary>
                }
              />
              <Route
                path="/terms"
                element={
                  <RouteErrorBoundary location="/terms">
                    <TermsPage />
                  </RouteErrorBoundary>
                }
              />
              <Route
                path="/tech"
                element={
                  <RouteErrorBoundary location="/">
                    <Posts />
                  </RouteErrorBoundary>
                }
              />
              <Route
                path="/article/:id/:slug"
                element={
                  <RouteErrorBoundary location="/article/:id/:slug">
                    <ArticlePage />
                  </RouteErrorBoundary>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CSSTransition>
        </TransitionGroup>
      </Suspense>
    </MainLayout>
  );
};

export default App;
