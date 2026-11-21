import { render, screen } from '@testing-library/react';
import { Tag, Tags } from './Tag';

describe('Tags', () => {
  it('links each tag to the href the app builds for its name', () => {
    render(<Tags tags={['Data Structures', 'C#']} hrefFor={name => `/tag/${encodeURIComponent(name)}`} />);

    expect(screen.getByText('#Data Structures')).toHaveAttribute('href', '/tag/Data%20Structures');
    expect(screen.getByText('#C#')).toHaveAttribute('href', '/tag/C%23');
  });
});

describe('Tag', () => {
  it('links to the given href', () => {
    render(<Tag name="React" href="https://blog.brianlusina.com/article/tag/React" />);

    expect(screen.getByText('#React')).toHaveAttribute('href', 'https://blog.brianlusina.com/article/tag/React');
  });
});
