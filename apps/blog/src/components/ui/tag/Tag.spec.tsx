import { render, screen } from '@testUtils/rtlUtils';
import { Tags } from './Tag';

describe('Tags', () => {
  it('links each tag to the tag page for its name', () => {
    render(<Tags tags={['Data Structures', 'C#']} />);

    expect(screen.getByText('#Data Structures')).toHaveAttribute('href', '/article/tag/Data%20Structures');
    expect(screen.getByText('#C#')).toHaveAttribute('href', '/article/tag/C%23');
  });
});
