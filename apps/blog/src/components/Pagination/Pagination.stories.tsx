import { Meta, StoryFn } from '@storybook/react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './Pagination';

export default {
  title: 'Components/Pagination',
  component: Pagination,
} as Meta<typeof Pagination>;

const Template: StoryFn<typeof Pagination> = (args) => (
  <Pagination {...args}>
    <PaginationContent>
      <PaginationItem>
        <PaginationPrevious href="#" />
      </PaginationItem>
      <PaginationItem>
        <PaginationLink href="#" isActive>
          1
        </PaginationLink>
      </PaginationItem>
      <PaginationItem>
        <PaginationNext href="#" />
      </PaginationItem>
    </PaginationContent>
  </Pagination>
);

export const DefaultPagination = Template.bind({});
