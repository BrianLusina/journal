import type { StorybookConfig } from '@storybook/react-vite';

// The Vite builder loads vite.config.mts, so stories resolve the app's path aliases
// (vite-tsconfig-paths) and get Tailwind through postcss.config.js.
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  // Drop the Sentry plugin, so a Storybook build never creates a Sentry release or uploads its maps.
  viteFinal: viteConfig => ({
    ...viteConfig,
    plugins: viteConfig.plugins
      ?.flat()
      .filter(plugin => !(plugin && 'name' in plugin && plugin.name.startsWith('sentry'))),
  }),
};

export default config;
