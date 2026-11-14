import { Meta, StoryFn } from '@storybook/react';
import ContactForm from './ContactForm';

// Storybook does not run the api/ functions, so sending shows the error message.
export default {
  title: 'Features/ContactForm',
  component: ContactForm,
} as Meta<typeof ContactForm>;

const Template: StoryFn<typeof ContactForm> = () => <ContactForm />;

export const Default = Template.bind({});
