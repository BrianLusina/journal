import type { Decorator, Preview } from '@storybook/react';
import { useEffect, type ReactNode } from 'react';
import '../styles.css';

// A toolbar switch for the `dark` class, which is all the preset's dark mode needs.
const ThemeClass = ({ dark, children }: { dark: boolean; children: ReactNode }) => {
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);
  return <>{children}</>;
};

const withTheme: Decorator = (Story, context) => (
  <ThemeClass dark={context.globals.theme === 'dark'}>
    <Story />
  </ThemeClass>
);

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Light or dark theme',
      defaultValue: 'light',
      toolbar: { title: 'Theme', icon: 'mirror', items: ['light', 'dark'], dynamicTitle: true },
    },
  },
  decorators: [withTheme],
};

export default preview;
