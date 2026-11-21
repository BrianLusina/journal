import { Meta, StoryFn } from '@storybook/react';
import ArticleCard from './ArticleCard';

export default {
  title: 'Components/ArticleCard',
  component: ArticleCard,
} as Meta<typeof ArticleCard>;

const Template: StoryFn<typeof ArticleCard> = (args) => (
  <div className="max-w-md">
    <ArticleCard {...args} />
  </div>
);

const props = {
  href: '/article/post-1/a-trip-north',
  title: 'A trip north',
  category: 'Travel',
  date: 'March 3, 2024',
};

export const WithThumbnail = Template.bind({});
WithThumbnail.args = {
  ...props,
  // An inline image, so the story needs no network or app asset.
  thumbnail:
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23a3b8a8"/></svg>',
};

export const WithoutThumbnail = Template.bind({});
WithoutThumbnail.args = {
  ...props,
};
