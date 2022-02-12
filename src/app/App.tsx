import { Suspense, FunctionComponent, lazy } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { Routes, Route, useLocation } from 'react-router-dom';
import MainLayout from '@layouts/MainLayout';
import usePageViews from '@hooks/analytics/usePageView';
import RouteErrorBoundary from '@components/Errors/RouteErrorBoundary';
import PageLoader from '@components/Elements/Loaders/PageLoader';
import ScrollToTop from '@components/ScrollToTop';

const Posts = lazy(() => import('@features/Posts'));
const ArticlePage = lazy(() => import('@pages/Article'));

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
                    <Posts />
                  </RouteErrorBoundary>
                }
              />
              <Route
                path="/:id/:slug"
                element={
                  <RouteErrorBoundary location="/article/:slug">
                    <ArticlePage />
                  </RouteErrorBoundary>
                }
              />
            </Routes>
          </CSSTransition>
        </TransitionGroup>
      </Suspense>
    </MainLayout>
  );
};

export default App;
