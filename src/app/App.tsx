import { Suspense, FunctionComponent, lazy } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { Routes, Route, useLocation } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import usePageViews from '@/hooks/analytics/usePageView';
import RouteErrorBoundary from '@/components/Errors/RouteErrorBoundary';
import PageLoader from '@/components/Elements/Loaders/PageLoader';
import ScrollToTop from '@/components/ScrollToTop';
import routes from '@/routes/routes';

const NotFound = lazy(() => import('@/pages/NotFound'));

const App: FunctionComponent = () => {
  const location = useLocation();
  usePageViews();

  const routePaths = routes.flatMap(({ path, alternatePaths, component: Component }) => {
    const alternativeRoutes = alternatePaths
      .flatMap((alternatePath) => alternatePath)
      .map((altPath) => ({
        path: altPath,
        component: Component,
      }));

    return [
      {
        component: Component,
        path,
      },
      ...alternativeRoutes,
    ];
  });

  return (
    <MainLayout>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <TransitionGroup>
          <CSSTransition key={location.pathname} classNames="fade" timeout={300}>
            <Routes location={location}>
              {routePaths.map(({ path, component: Component }) => (
                <Route
                  path={path}
                  element={
                    <RouteErrorBoundary location={path}>
                      <Component />
                    </RouteErrorBoundary>
                  }
                />
              ))}
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
