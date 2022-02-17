import { ComponentStory, ComponentMeta } from '@storybook/react';
import faker from 'faker';
import Blurb from './Blurb';

export default {
  title: 'Components/Blurb',
  component: Blurb,
} as ComponentMeta<typeof Blurb>;

const Template: ComponentStory<typeof Blurb> = (args) => <Blurb {...args} />;

const title = faker.lorem.sentence();
const text = faker.lorem.paragraph();

export const DefaultBlurb = Template.bind({});
DefaultBlurb.args = {
  title,
  content: text,
};
