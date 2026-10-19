import { Meta, StoryFn } from '@storybook/react';
import SubscribeForm from './SubscribeForm';

// Storybook does not run the api/ functions, so subscribing shows the error message.
export default {
  title: 'Features/NewsLetter/SubscribeForm',
  component: SubscribeForm,
} as Meta<typeof SubscribeForm>;

const Template: StoryFn<typeof SubscribeForm> = () => <SubscribeForm />;

export const Default = Template.bind({});
