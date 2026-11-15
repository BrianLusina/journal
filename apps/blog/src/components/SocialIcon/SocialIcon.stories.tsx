import { Meta, StoryFn } from '@storybook/react';
import faker from 'faker';
import SocialIcon from './SocialIcon';

const link = faker.internet.url();

export default {
  title: 'Components/SocialIcon',
  component: SocialIcon,
} as Meta<typeof SocialIcon>;

const Template: StoryFn<typeof SocialIcon> = (args) => <SocialIcon {...args} />;

export const InstagramSocialIcon = Template.bind({});
InstagramSocialIcon.args = {
  link,
  name: 'instagram',
  theme: 'light',
};
