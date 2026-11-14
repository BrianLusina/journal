import { Meta, StoryFn } from '@storybook/react';
import PageLoader from './PageLoader';

export default {
  title: 'Components/loaders/PageLoader',
  component: PageLoader,
} as Meta<typeof PageLoader>;

const Template: StoryFn<typeof PageLoader> = () => <PageLoader />;

export const FullPageLoader = Template.bind({});
FullPageLoader.args = {};
