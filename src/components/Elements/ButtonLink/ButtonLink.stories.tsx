import { ComponentStory, ComponentMeta } from '@storybook/react';
import faker from 'faker';
import ButtonLink from './ButtonLink';

export default {
  title: 'Components/Elements/ButtonLink',
  component: ButtonLink,
} as ComponentMeta<typeof ButtonLink>;

const Template: ComponentStory<typeof ButtonLink> = (args) => <ButtonLink {...args} />;

const link = faker.internet.url();
const name = faker.random.word();

export const DefaultButtonLink = Template.bind({});
DefaultButtonLink.args = {
  path: link,
  text: name,
};
