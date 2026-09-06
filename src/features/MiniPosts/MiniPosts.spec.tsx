import faker from 'faker';
import { render, screen, act } from '@testing-library/react';
import MockApp from '@testUtils/MockApp';
import * as Monitoring from '@monitoring';
import MiniPosts from './MiniPosts';
import { usePosts } from '@hooks';

jest.mock('@monitoring', () => {
  return {
    captureException: jest.fn(),
    captureScope: jest.fn(),
    Severity: {
      Error: 'error',
    },
  };
});

jest.mock('@hooks/cms/usePosts');

describe('MiniPosts', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', async () => {
    (usePosts as jest.Mock).mockReturnValue({
      data: null,
      loading: true,
      error: null,
    });
    
    render(
      <MockApp mocks={[]}>
        <MiniPosts />
      </MockApp>,
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display content as received from hook', async () => {
    const items = [
      {
        id: faker.datatype.uuid(),
        source: 'contentful',
        title: 'Some Title',
        subtitle: faker.lorem.words(),
        description: faker.lorem.text(),
        category: faker.lorem.word(),
        slug: faker.lorem.word(),
        publishDate: faker.date.past().toISOString(),
        thumbnail: {
          url: faker.image.imageUrl(),
        },
        tags: [faker.lorem.word()],
        authors: [{ id: faker.datatype.uuid() }],
      },
      {
        id: faker.datatype.uuid(),
        source: 'notion',
        title: 'other title',
        subtitle: faker.lorem.words(),
        description: faker.lorem.text(),
        category: faker.lorem.word(),
        slug: faker.lorem.word(),
        publishDate: faker.date.past().toISOString(),
        thumbnail: {
          url: faker.image.imageUrl(),
        },
        tags: [faker.lorem.word()],
        authors: [{ id: faker.datatype.uuid() }],
      },
    ];

    (usePosts as jest.Mock).mockReturnValue({
      data: {
        items,
        total: items.length,
        limit: 5,
        skip: 0,
      },
      loading: false,
      error: null,
    });

    render(
      <MockApp mocks={[]}>
        <MiniPosts />
      </MockApp>,
    );

    for (const item of items) {
      const postTitleElement = await screen.findByText(item.title);
      expect(postTitleElement).toBeInTheDocument();
    }
  });

  it('should display error if query fails to fetch content', async () => {
    const mockError = new Error(faker.lorem.words());
    
    (usePosts as jest.Mock).mockReturnValue({
      data: null,
      loading: false,
      error: mockError,
    });

    render(
      <MockApp mocks={[]}>
        <MiniPosts />
      </MockApp>,
    );

    const errorMsg = await screen.findByText(/Yikes! Something terrible has happened/i);
    expect(errorMsg).toBeInTheDocument();

    expect(Monitoring.captureException).toBeCalledTimes(1);
    expect(Monitoring.captureScope).toBeCalledTimes(1);
  });
});
