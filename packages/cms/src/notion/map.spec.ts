import { notionPage } from './__fixtures__';
import { mapNotionPage, type NotionPage } from './map';

const map = (page: unknown) => mapNotionPage(page as NotionPage);

describe('mapNotionPage', () => {
  it('maps a Journal CMS page onto the unified post model', () => {
    const cover = { url: 'https://prod-files-secure.s3.us-west-2.amazonaws.com/decision.png', title: 'Cover Image' };

    expect(map(notionPage())).toEqual({
      id: '7d3761f9-323d-4a15-a0e3-d000221fc5ac',
      source: 'notion',
      title: 'Navigating Decision-Making in Engineering: A Framework-Centric Approach',
      slug: 'navigating-decision-making',
      description: 'A Framework-Centric Approach',
      category: 'engineering strategy 101',
      publishDate: '2024-02-07T04:00:00.000+00:00',
      heroImage: cover,
      thumbnail: cover,
      tags: ['Decision', 'Framework'],
      authors: [{ id: 'notion-author', source: 'notion', name: 'Brian Lusina' }],
    });
  });

  it('joins text split across segments and reads an external cover image', () => {
    const post = map(
      notionPage({
        // Notion splits text wherever its formatting changes.
        Title: { type: 'title', title: [{ plain_text: 'Clean code is ' }, { plain_text: 'not mandatory' }] },
        // The slug route matches the whole slug text, so every segment must be part of the link.
        Slug: { type: 'rich_text', rich_text: [{ plain_text: 'clean-code-' }, { plain_text: 'is-not-mandatory' }] },
        Description: { type: 'rich_text', rich_text: [{ plain_text: 'On ' }, { plain_text: 'craft' }] },
        Authors: { type: 'rich_text', rich_text: [{ type: 'text', plain_text: 'kanekotic' }] },
        'Cover Image': {
          type: 'files',
          files: [{ name: 'cover.png', type: 'external', external: { url: 'https://images/cover.png' } }],
        },
      }),
    );

    expect(post).toMatchObject({
      title: 'Clean code is not mandatory',
      slug: 'clean-code-is-not-mandatory',
      description: 'On craft',
      heroImage: { url: 'https://images/cover.png', title: 'Cover Image' },
      authors: [{ id: 'notion-author', source: 'notion', name: 'kanekotic' }],
    });
  });

  it('falls back when title, description, category, date, tags, authors and cover image are empty', () => {
    const post = map(
      notionPage({
        Title: { type: 'title', title: [] },
        Description: { type: 'rich_text', rich_text: [] },
        Categories: { type: 'multi_select', multi_select: [] },
        Published: { type: 'date', date: null },
        Tags: { type: 'multi_select', multi_select: [] },
        Authors: { type: 'rich_text', rich_text: [] },
        'Cover Image': { type: 'files', files: [] },
      }),
    );

    expect(post).toEqual({
      id: '7d3761f9-323d-4a15-a0e3-d000221fc5ac',
      source: 'notion',
      title: 'Untitled',
      slug: 'navigating-decision-making',
      description: undefined,
      category: undefined,
      publishDate: '2024-02-06T10:12:00.000Z',
      heroImage: undefined,
      thumbnail: undefined,
      tags: [],
      authors: [],
    });
  });
});
