import { Meta, StoryFn } from '@storybook/react';
import faker from 'faker';
import Blurb from './Blurb';

export default {
  title: 'Components/Blurb',
  component: Blurb,
} as Meta<typeof Blurb>;

const Template: StoryFn<typeof Blurb> = (args) => <Blurb {...args} />;

const title = faker.lorem.sentence();
const text = faker.lorem.paragraph();

export const DefaultBlurb = Template.bind({});
DefaultBlurb.args = {
  title,
  content: text,
};
