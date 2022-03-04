// const { pathsToModuleNameMapper } = require('ts-jest');
// const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  roots: ['<rootDir>'],
  preset: 'ts-jest',
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.d.ts'],
  displayName: {
    name: 'ljournal',
    color: 'yellow',
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__generated__/',
    '<rootDir>/src/tests/AppMock.tsx',
    '<rootDir>/src/tests/rtlTestUtils.ts',
    '<rootDir>/src/services/logger/',
    '<rootDir>/src/services/monitoring/',
    '<rootDir>/src/services/firebase/',
    '<rootDir>/src/services/analytics/',
    '<rootDir>/src/utils/log/index.ts',
    '<rootDir>/src/reportWebVitals.ts',
    '<rootDir>/src/registerServiceWorker.ts',
    '<rootDir>/src/stories',
    '<rootDir>/src/*.stories.tsx',
    '<rootDir>/src/*.stories.@(js|jsx|ts|tsx)',
    '<rootDir>/src/types/',
    '<rootDir>/src/index.tsx',
    '<rootDir>/src/styles/',
    '<rootDir>/src/config/',
    '<rootDir>/src/api/rest/dto.ts',
    '<rootDir>/src/store/rootReducer.ts',
    '<rootDir>/src/store/index.ts',
    '<rootDir>/src/routes/PrivateRoute.tsx',
    'types.ts',
    'styles.ts',
    'styles.js',
    '.styles.ts',
    '.styles.jsx',
    '.styles.js',
    '.styles.jsx',
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
    '.stories.tsx',
    '.stories.jsx',
    '.stories.js',
    '.stories.ts',
    '.story.tsx',
    '.story.ts',
    '.interface.ts',
    '.interface.js',
    '.interface.jsx',
    '.interface.tsx',
    '.d.ts',
    '.props.ts',
    '.props.js',
    '.props.jsx',
    'actionTypes.ts',
    'mockData.ts',
    'mockData.js',
    'actions.ts',
    'actionCreators.ts',
    '<rootDir>/src/utils/constants.ts',
    '<rootDir>/src/hooks/analytics/usePageView.ts',
    '<rootDir>/src/setupProxy.js',
    '<rootDir>/src/test',
    '<rootDir>/src/api/rest/RestClient.ts',
    '<rootDir>/src/api/graphql',
    'exceptions.ts',
    'rootReducer.ts',
    'rootReducer.js',
    'slice.js',
    'slice.ts',
    'routes.ts',
    'routes.js',
    'mediaQueries.ts',
    'index.ts',
    '<rootDir>/src/app/App.tsx',
    '<rootDir>/src/data',
    '<rootDir>/src/providers/graphql',
    '<rootDir>/src/components/Errors',
    '<rootDir>/src/layouts/MainLayout.tsx',
    '<rootDir>/src/components/Messaging/Notification/NotificationContainer.tsx',
  ],
  setupFiles: [
    'react-app-polyfill/jsdom',
    '<rootDir>/config/mocks/browserMock.js',
    '<rootDir>/config/mocks/axios.js',
    '<rootDir>/config/mocks/intersectionObserver.js',
    '<rootDir>/config/mocks/reactRouterDom.js',
  ],
  setupFilesAfterEnv: ['<rootDir>/scripts/ts/setupTests.ts'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
  ],
  testEnvironment: 'jsdom',
  testRunner: '<rootDir>/node_modules/jest-circus/runner.js',
  transform: {
    '^.+\\.(js|jsx|mjs|cjs|ts|tsx)$': '<rootDir>/node_modules/babel-jest',
    '^.+\\.css$': '<rootDir>/config/jest/cssTransform.js',
    '^(?!.*\\.(js|jsx|mjs|cjs|ts|tsx|css|json)$)': '<rootDir>/config/jest/fileTransform.js',
    '^.+\\.(ts|tsx)?$': 'ts-jest',
    '^.+\\.[t|j]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|mjs|cjs|ts|tsx)$',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  modulePaths: ['<rootDir>'],
  moduleNameMapper: {
    '^react-native$': 'react-native-web',
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    // ...pathsToModuleNameMapper(compilerOptions.paths),
    '^@assets/(.*)$': '<rootDir>/src/assets/$1',
    '^@icons/(.*)$': '<rootDir>/src/assets/icons/$1',
    '^@images/(.*)$': '<rootDir>/src/assets/images/$1',
    '^@fonts/(.*)$': '<rootDir>/src/assets/fonts/$1',
    '^@app': '<rootDir>/src/app/index.ts',
    '^@config': '<rootDir>/src/config/index.ts',
    '^@apiConfig': '<rootDir>/src/config/api.ts',
    '^@graphQl/(.*)$': '<rootDir>/src/api/graphql/$1',
    '^@graphQlClient': '<rootDir>/src/api/graphql/GraphqlClient.ts',
    '^@providers/(.*)$': '<rootDir>/src/providers/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@containers/(.*)$': '<rootDir>/src/containers/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@layouts/(.*)$': '<rootDir>/src/layouts/$1',
    '^@routes': '<rootDir>/src/config/routes.ts',
    '^@utils': '<rootDir>/src/utils/utils.ts',
    '^@timeUtils': '<rootDir>/src/utils/time/timeUtils.ts',
    '^@timeConstants': '<rootDir>/src/utils/time/constants.ts',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@monitoring': '<rootDir>/src/services/monitoring/index.ts',
    '^@analytics': '<rootDir>/src/services/analytics/index.ts',
    '^@testUtils': '<rootDir>/src/test/index.ts',
    '^@testUtils/(.*)$': '<rootDir>/src/test/$1',
    '^@styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@styled/(.*)$': '<rootDir>/src/styles/ts/$1',
    '^@scss/(.*)$': '<rootDir>/src/styles/scss/$1',
    '^@css/(.*)$': '<rootDir>/src/styles/css/$1',
  },
  moduleFileExtensions: [
    'web.js',
    'js',
    'web.ts',
    'ts',
    'web.tsx',
    'tsx',
    'json',
    'web.jsx',
    'jsx',
    'node',
  ],
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
  resetMocks: true,
  coverageThreshold: {
    global: {
      lines: 85,
      statements: 85,
    },
  },
};
