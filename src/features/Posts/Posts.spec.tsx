import faker from 'faker';
import { render, screen, act, fireEvent } from '@testing-library/react';
import MockApp from '@testUtils/MockApp';
import * as Monitoring from '@services/monitoring';
import Posts from './Posts';
import { usePosts } from '@hooks/cms/usePosts';

jest.mock('@services/monitoring', () => {
  return {
    captureException: jest.fn(),
    captureScope: jest.fn(),
    Severity: {
      Error: 'error',
    },
  };
});

jest.mock('@hooks/cms/usePosts');

describe('Posts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state', async () => {
    (usePosts as jest.Mock).mockReturnValue({
      data: null,
      loading: true,
      error: null,
    });
    
    render(
      <MockApp mocks={[]}>
        <Posts />
      </MockApp>,
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display content as received from query', async () => {
    const items = [
      {
        id: faker.datatype.uuid(),
        source: 'contentful',
        heroImage: {
          url: faker.image.imageUrl(),
          title: 'Hero 1',
        },
        title: faker.lorem.word(),
        subtitle: faker.lorem.words(),
        description: faker.lorem.text(),
        category: faker.lorem.word(),
        slug: faker.random.word(),
        publishDate: faker.date.past().toISOString(),
        tags: [faker.lorem.word()],
        authors: [{ id: faker.datatype.uuid() }],
      },
      {
        id: faker.datatype.uuid(),
        source: 'notion',
        heroImage: {
          url: faker.image.imageUrl(),
          title: 'Hero 2',
        },
        title: faker.lorem.word(),
        subtitle: faker.lorem.words(),
        description: faker.lorem.text(),
        category: faker.lorem.word(),
        slug: faker.random.word(),
        publishDate: faker.date.past().toISOString(),
        tags: [faker.lorem.word()],
        authors: [{ id: faker.datatype.uuid() }],
      },
    ];

    (usePosts as jest.Mock).mockReturnValue({
      data: {
        items,
        total: items.length + 1,
        limit: 10,
        skip: 0,
      },
      loading: false,
      error: null,
    });

    render(
      <MockApp mocks={[]}>
        <Posts />
      </MockApp>,
    );

    items.forEach((item) => {
      const postTitleElements = screen.getAllByText(item.title);
      const postSubtitleElements = screen.getAllByText(item.subtitle);
      const heroImageElement = screen.getByAltText(item.heroImage.title);

      expect(postTitleElements[0]).toBeInTheDocument();
      expect(postSubtitleElements[0]).toBeInTheDocument();
      expect(heroImageElement.getAttribute('src')).toContain(item.heroImage.url);
    });
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
        <Posts />
      </MockApp>,
    );

    const errorMsg = await screen.findByText(/Yikes! Something terrible has happened/i);
    expect(errorMsg).toBeInTheDocument();

    expect(Monitoring.captureException).toBeCalledTimes(1);
    expect(Monitoring.captureScope).toBeCalledTimes(1);
  });

  it('should handle fetchMore to display more data', async () => {
    const items = [
      {
        id: faker.datatype.uuid(),
        source: 'contentful',
        heroImage: {
          url: faker.image.imageUrl(),
          title: 'Hero 1',
        },
        title: faker.lorem.word(),
        subtitle: faker.lorem.words(),
        description: faker.lorem.text(),
        category: faker.lorem.word(),
        slug: faker.random.word(),
        publishDate: faker.date.past().toISOString(),
        tags: [faker.lorem.word()],
        authors: [{ id: faker.datatype.uuid() }],
      },
    ];

    const newItem = {
        id: faker.datatype.uuid(),
        source: 'notion',
        heroImage: {
          url: faker.image.imageUrl(),
          title: 'Hero 2',
        },
        title: faker.lorem.word(),
        subtitle: faker.lorem.words(),
        description: faker.lorem.text(),
        category: faker.lorem.word(),
        slug: faker.random.word(),
        publishDate: faker.date.past().toISOString(),
        tags: [faker.lorem.word()],
        authors: [{ id: faker.datatype.uuid() }],
    };

    let renderCount = 0;
    (usePosts as jest.Mock).mockImplementation(({ limit }) => {
      renderCount++;
      // First render (limit: 10)
      if (limit === 10) {
        return {
          data: {
            items,
            total: 2,
            limit: 10,
            skip: 0,
          },
          loading: false,
          error: null,
        };
      }
      
      // Subsequent render (limit: 20 after "Load More" clicked)
      return {
          data: {
            items: [...items, newItem],
            total: 2,
            limit: 20,
            skip: 0,
          },
          loading: false,
          error: null,
      };
    });

    render(
      <MockApp mocks={[]}>
        <Posts />
      </MockApp>,
    );

    const loadMoreBtn = await screen.findByText('Load More');
    fireEvent.click(loadMoreBtn);

    const postTitleElements = await screen.findAllByText(newItem.title);
    const postSubtitleElements = await screen.findAllByText(newItem.subtitle);
    const heroImageElement = screen.getByAltText(newItem.heroImage.title);

    expect(postTitleElements[0]).toBeInTheDocument();
    expect(postSubtitleElements[0]).toBeInTheDocument();
    expect(heroImageElement.getAttribute('src')).toContain(newItem.heroImage.url);
  });
});
