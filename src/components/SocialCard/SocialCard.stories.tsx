import { ComponentStory, ComponentMeta } from '@storybook/react';
import faker from 'faker';
import SocialCard from './SocialCard';

const link = faker.internet.url();
const name = faker.random.word();

export default {
  title: 'Components/SocialCard',
  component: SocialCard,
} as ComponentMeta<typeof SocialCard>;

const Template: ComponentStory<typeof SocialCard> = (args) => <SocialCard {...args} />;

export const SocialCardItems = Template.bind({});
SocialCardItems.args = {
  items: [
    {
      link,
      name,
      icon: 'facebook',
    },
    {
      link,
      name,
      icon: 'twitter',
    },
  ],
};
