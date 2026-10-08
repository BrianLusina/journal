import type { Preview } from '@storybook/react';
// Relative imports: vite-tsconfig-paths only resolves aliases for files under src/, which tsconfig.app.json includes.
import MockAppWithRouter from '../src/test/MockAppWithRouter';
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
  ],
};

export default preview;
