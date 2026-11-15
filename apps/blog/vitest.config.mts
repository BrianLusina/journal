import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.mts';

// Reuses vite.config.mts, so tests get the app's transforms and the tsconfig.app.json path aliases.
export default defineConfig((env) => {
  const app = viteConfig(env);
  // Drop the Sentry plugin, so a test run never sends telemetry to Sentry.
  const plugins = app.plugins
    ?.flat()
    .filter((plugin) => !(plugin && 'name' in plugin && plugin.name.startsWith('sentry')));

  return mergeConfig(
    { ...app, plugins },
    {
      // A folder with no .env files: like Jest, tests ignore a developer's local .env settings.
      envDir: `${import.meta.dirname}/config`,
      resolve: {
        alias: {
          'react-markdown': `${import.meta.dirname}/config/mocks/react-markdown.jsx`,
        },
      },
      test: {
        globals: true,
        environment: 'jsdom',
        // Jest's default page URL, which specs assert on.
        environmentOptions: { jsdom: { url: 'http://localhost/' } },
        include: [
          'src/**/__tests__/**/*.{js,jsx,ts,tsx}',
          'src/**/*.{spec,test}.{js,jsx,ts,tsx}',
          'api/**/*.{spec,test}.{js,ts}',
          'scripts/**/*.{spec,test}.{js,ts}',
          'server/**/*.{spec,test}.{js,ts}',
        ],
        setupFiles: [
          'config/mocks/browserMock.js',
          'config/mocks/axios.js',
          'config/mocks/intersectionObserver.js',
          'config/mocks/reactRouterDom.js',
          'scripts/ts/setupTests.ts',
        ],
        mockReset: true,
        coverage: {
          provider: 'v8',
          include: ['src/**/*.{js,jsx,ts,tsx}'],
          // Globs for the substrings jest.config.js ignored: a bare name such as 'index.ts' matched it
          // anywhere in the path, so it also matched index.tsx. One difference: Jest's '.d.ts' regex
          // also matched any '<char>d.ts' (ArticleCard.tsx, Feed.tsx, ...), which were not meant to be
          // excluded and are now measured.
          exclude: [
            '**/*.d.ts',
            '**/__generated__/**',
            'src/tests/AppMock.tsx',
            'src/tests/rtlTestUtils.ts',
            'src/services/logger/**',
            'src/services/monitoring/**',
            'src/services/firebase/**',
            'src/services/analytics/**',
            'src/utils/log/index.ts',
            'src/reportWebVitals.ts',
            'src/registerServiceWorker.ts',
            'src/stories*/**',
            'src/types/**',
            'src/index.tsx',
            'src/styles/**',
            'src/config/**',
            'src/api/rest/dto.ts',
            'src/store/rootReducer.ts',
            'src/store/index.ts',
            'src/routes/PrivateRoute.tsx',
            'src/utils/constants.ts',
            'src/hooks/analytics/usePageView.ts',
            'src/setupProxy.js',
            'src/test*',
            'src/test*/**',
            'src/api/rest/RestClient.ts',
            'src/api/graphql*',
            'src/api/graphql*/**',
            'src/app/App.tsx',
            'src/data*',
            'src/data*/**',
            'src/providers/graphql*',
            'src/providers/graphql*/**',
            'src/components/Errors*/**',
            'src/layouts/MainLayout.tsx',
            'src/components/Messaging/Notification/NotificationContainer.tsx',
            ...[
              'types.ts',
              'styles.ts',
              'styles.js',
              'styles.jsx',
              'styles.tsx',
              'style.ts',
              'style.js',
              'state.ts',
              'data.ts',
              'data.js',
              'constants.js',
              'constants.ts',
              'initialState.ts',
              '.stories.',
              '.story.ts',
              '.interface.',
              '.props.',
              'actionTypes.ts',
              'mockData.',
              'actions.ts',
              'actionCreators.ts',
              'exceptions.ts',
              'rootReducer.',
              'slice.js',
              'slice.ts',
              'routes.ts',
              'routes.js',
              'mediaQueries.ts',
              'index.ts',
            ].flatMap((name) => [`**/*${name}*`, `**/*${name}*/**`]),
          ],
          // Jest's reporters; Codecov reads lcov.
          reporter: ['clover', 'json', 'lcov', 'text'],
          thresholds: {
            lines: 85,
            statements: 85,
          },
        },
      },
    },
  );
});
