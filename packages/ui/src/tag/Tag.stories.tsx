import { Meta, StoryFn } from '@storybook/react';
import { Tags } from './Tag';

export default {
  title: 'Components/Tags',
  component: Tags,
} as Meta<typeof Tags>;

export const Default: StoryFn<typeof Tags> = () => (
  <Tags tags={['React', 'Data Structures', 'C#']} hrefFor={name => `#${encodeURIComponent(name)}`} />
);
