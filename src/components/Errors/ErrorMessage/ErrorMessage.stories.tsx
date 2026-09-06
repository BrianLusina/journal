import { ComponentStory, ComponentMeta } from '@storybook/react';
import ErrorMessage from './ErrorMessage';

export default {
  title: 'Pages/errors/ErrorPage',
  component: ErrorMessage,
} as ComponentMeta<typeof ErrorMessage>;

const Template: ComponentStory<typeof ErrorMessage> = (args) => <ErrorMessage {...args} />;

export const SimpleErrorPage = Template.bind({});
SimpleErrorPage.args = {};

export const ErrorPageWithProps = Template.bind({});
ErrorPageWithProps.args = {
  title: 'Error',
  message: 'Something went wrong',
};
