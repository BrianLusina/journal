import { Meta, StoryFn } from '@storybook/react';
import SearchLauncher from './SearchLauncher';

/**
 * The navbar's search button. Click it, or press ⌘K, Ctrl+K or /, to open the search dialog.
 * Storybook has no /api routes, so the dialog shows its "Search couldn't load" state; the
 * SearchResults stories show the others.
 */
export default {
  title: 'Components/SearchLauncher',
  component: SearchLauncher,
} as Meta<typeof SearchLauncher>;

const Template: StoryFn<typeof SearchLauncher> = () => <SearchLauncher />;

export const Default = Template.bind({});
