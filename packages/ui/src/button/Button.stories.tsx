import { Meta, StoryFn } from '@storybook/react';
import Button from './Button';

export default {
  title: 'Components/Elements/Button',
  component: Button,
} as Meta<typeof Button>;

const Template: StoryFn<typeof Button> = (args) => <Button {...args} />;

export const DefaultButton = Template.bind({});
DefaultButton.args = {
  onClick: (e?: unknown) => {
    console.log('Button clicked', e);
  },
  children: 'Click me',
};
