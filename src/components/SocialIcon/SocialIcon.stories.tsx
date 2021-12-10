import { ComponentStory, ComponentMeta } from '@storybook/react';
import faker from 'faker';
import SocialIcon from './SocialIcon';

const link = faker.internet.url();
const name = faker.random.word();

export default {
  title: 'Components/SocialIcon',
  component: SocialIcon,
} as ComponentMeta<typeof SocialIcon>;

const Template: ComponentStory<typeof SocialIcon> = (args) => <SocialIcon {...args} />;

export const FacebookSocialIcon = Template.bind({});
FacebookSocialIcon.args = {
  link,
  name,
  icon: 'facebook',
};
