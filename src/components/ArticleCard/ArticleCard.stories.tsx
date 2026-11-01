import { Meta, StoryFn } from '@storybook/react';
import defaultFeature from '@/assets/images/default_feature_pic.jpg';
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
  id: 'post-1',
  slug: 'a-trip-north',
  title: 'A trip north',
  category: 'Travel',
  date: 'March 3, 2024',
};

export const WithThumbnail = Template.bind({});
WithThumbnail.args = {
  ...props,
  thumbnail: defaultFeature,
};

export const WithoutThumbnail = Template.bind({});
WithoutThumbnail.args = {
  ...props,
};
