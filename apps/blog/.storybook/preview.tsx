import type { Preview } from '@storybook/react';
// Relative imports: vite-tsconfig-paths only resolves aliases for files under src/, which tsconfig.app.json includes.
import MockAppWithRouter from '../src/test/MockAppWithRouter';
import ThemeProvider from '../src/providers/theme/ThemeProvider';
import '../src/styles/css/index.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  decorators: [
    Story => (
      <MockAppWithRouter>
        <Story />
      </MockAppWithRouter>
    ),
    // Wraps stories in the app's theme provider, so the Navbar's dark-mode toggle switches the theme as it does in the app.
    Story => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
};

export default preview;
