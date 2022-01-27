import { ComponentStory, ComponentMeta } from '@storybook/react';
import faker from 'faker';
import Pagination from './Pagination';

export default {
  title: 'Components/Pagination',
  component: Pagination,
} as ComponentMeta<typeof Pagination>;

const Template: ComponentStory<typeof Pagination> = (args) => <Pagination {...args} />;

const hasNextPage = faker.datatype.boolean();
const text = faker.lorem.word();

export const DefaultPagination = Template.bind({});
DefaultPagination.args = {
  onClick: () => {
    console.log('Clicked');
  },
  hasNextPage,
  text,
};
