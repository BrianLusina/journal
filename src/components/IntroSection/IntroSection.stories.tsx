import { Meta, StoryFn } from '@storybook/react';
import Intro from './IntroSection';

export default {
  title: 'Components/Intro',
  component: Intro,
} as Meta<typeof Intro>;

const Template: StoryFn<typeof Intro> = (args) => <Intro {...args} />;

export const DefaultIntro = Template.bind({});
DefaultIntro.args = {
  title: 'Intro',
  desc: 'Intro description',
  logoUrl: 'https://via.placeholder.com/150',
};
