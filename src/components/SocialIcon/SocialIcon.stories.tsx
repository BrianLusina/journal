import { Meta, StoryFn } from '@storybook/react';
import faker from 'faker';
import SocialIcon from './SocialIcon';

const link = faker.internet.url();
const name = faker.random.word();

export default {
  title: 'Components/SocialIcon',
  component: SocialIcon,
} as Meta<typeof SocialIcon>;

const Template: StoryFn<typeof SocialIcon> = (args) => <SocialIcon {...args} />;

export const FacebookSocialIcon = Template.bind({});
FacebookSocialIcon.args = {
  link,
  name,
  icon: 'facebook',
};
