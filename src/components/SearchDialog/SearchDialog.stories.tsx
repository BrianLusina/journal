import { Meta, StoryFn } from '@storybook/react';
import { useState } from 'react';
import SearchDialog from './SearchDialog';

/**
 * The search modal, open. Storybook has no /api routes, so the index can't load and the dialog
 * shows its "Search couldn't load" state; the SearchResults stories show the other states.
 */
export default {
  title: 'Components/SearchDialog',
  component: SearchDialog,
} as Meta<typeof SearchDialog>;

const Template: StoryFn<typeof SearchDialog> = () => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open search
      </button>
      <SearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
};

export const Open = Template.bind({});
