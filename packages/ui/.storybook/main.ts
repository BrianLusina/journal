import type { StorybookConfig } from '@storybook/react-vite';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';
import preset, { uiContent } from '../tailwind-preset';

// The package's own Storybook. It builds Tailwind from the preset and uiContent alone, so it shows
// the components the way any app that uses the package gets them.
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials'],
  framework: { name: '@storybook/react-vite', options: {} },
  viteFinal: viteConfig => ({
    ...viteConfig,
    css: {
      ...viteConfig.css,
      postcss: { plugins: [tailwindcss({ presets: [preset], content: uiContent }), autoprefixer()] },
    },
  }),
};

export default config;
