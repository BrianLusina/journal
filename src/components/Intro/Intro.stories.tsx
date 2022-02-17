import { ComponentStory, ComponentMeta } from '@storybook/react';
import Intro from './Intro';

export default {
  title: 'Components/Intro',
  component: Intro,
} as ComponentMeta<typeof Intro>;

const Template: ComponentStory<typeof Intro> = (args) => <Intro {...args} />;

export const DefaultIntro = Template.bind({});
DefaultIntro.args = {
  title: 'Intro',
  desc: 'Intro description',
  logoUrl: 'https://via.placeholder.com/150',
};
