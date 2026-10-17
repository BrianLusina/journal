import { render, screen } from '@testUtils/rtlUtils';
import AuthorBadge from './AuthorBadge';

const author = (overrides: Partial<UnifiedAuthor> = {}): UnifiedAuthor => ({
  id: 'author-1',
  source: 'contentful',
  name: 'Ada Lovelace',
  avatarUrl: 'https://images/ada.png',
  shortBio: 'Writes about engines.',
  ...overrides,
});

describe('AuthorBadge', () => {
  it('renders a Contentful author and links to the authors page', () => {
    render(<AuthorBadge author={author()} />);

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Writes about engines.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toHaveAttribute('src', 'https://images/ada.png');
    expect(screen.getByRole('link')).toHaveAttribute('href', '/authors/author-1');
  });

  it('renders a Notion author without a link, since Notion people have no author page', () => {
    render(<AuthorBadge author={author({ id: 'notion-user', source: 'notion', shortBio: undefined })} />);

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('falls back to the default avatar', () => {
    render(<AuthorBadge author={author({ avatarUrl: undefined })} />);

    // Jest's file transform resolves image imports to their file name.
    expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toHaveAttribute('src', 'avatar.jpg');
  });

  it('renders nothing for an author without a name', () => {
    const { container } = render(<AuthorBadge author={author({ name: undefined })} />);

    expect(container).toBeEmptyDOMElement();
  });
});
