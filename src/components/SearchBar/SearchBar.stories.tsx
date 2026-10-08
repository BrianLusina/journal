import { Meta, StoryFn } from '@storybook/react';
import SearchBar from './SearchBar';

export default {
  title: 'Components/SearchBar',
  component: SearchBar,
} as Meta<typeof SearchBar>;

const Template: StoryFn<typeof SearchBar> = (args) => <SearchBar {...args} />;

export const DefaultSearchBar = Template.bind({});
DefaultSearchBar.args = {};
