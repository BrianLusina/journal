import { ComponentStory, ComponentMeta } from '@storybook/react';
import faker from 'faker';
import Pagination from './Pagination';

export default {
  title: 'Components/Pagination',
  component: Pagination,
} as ComponentMeta<typeof Pagination>;

const Template: ComponentStory<typeof Pagination> = (args) => <Pagination {...args} />;

const nextLink = faker.internet.url();
const prevLink = faker.internet.url();

export const DefaultPagination = Template.bind({});
DefaultPagination.args = {
  nextUrl: nextLink,
  previousUrl: prevLink,
};
