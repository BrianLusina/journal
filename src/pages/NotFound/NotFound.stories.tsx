import { Meta, StoryFn } from '@storybook/react';
import NotFound from './NotFound';

export default {
  title: 'Pages/NotFound',
  component: NotFound,
} as Meta<typeof NotFound>;

const Template: StoryFn<typeof NotFound> = (args) => <NotFound {...args} />;

export const NotFoundPage = Template.bind({});
NotFoundPage.args = {};
