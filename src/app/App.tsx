import { Suspense, FunctionComponent, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import usePageViews from '@/hooks/analytics/usePageView';
import RouteErrorBoundary from '@/components/Errors/RouteErrorBoundary';
import PageLoader from '@/components/Elements/Loaders/PageLoader';
import ScrollToTop from '@/components/ScrollToTop';
import routes from '@/routes/routes';

const NotFound = lazy(() => import('@/pages/NotFound'));

const App: FunctionComponent = () => {
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
        <Routes>
          {routePaths.map(({ path, component: Component }) => (
            <Route
              key={path}
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
      </Suspense>
    </MainLayout>
  );
};

export default App;
