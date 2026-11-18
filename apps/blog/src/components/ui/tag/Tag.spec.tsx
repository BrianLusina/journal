import { render, screen } from '@testUtils/rtlUtils';
import { Tags } from '.';

// The blog's tag pages are addressed by the tag's name, so names with spaces or # must be encoded.
describe('Tags in the blog', () => {
  it("links each tag to the blog's tag page for its encoded name", () => {
    render(<Tags tags={['Data Structures', 'C#']} />);

    expect(screen.getByText('#Data Structures')).toHaveAttribute('href', '/article/tag/Data%20Structures');
    expect(screen.getByText('#C#')).toHaveAttribute('href', '/article/tag/C%23');
  });
});
