import { Meta, StoryFn } from '@storybook/react';
import { ThemeToggle } from './ThemeToggle';

export default {
  title: 'Components/ThemeToggle',
  component: ThemeToggle,
} as Meta<typeof ThemeToggle>;

export const Default: StoryFn<typeof ThemeToggle> = () => <ThemeToggle />;
