import { GET_ALL_BLOGS } from '@graphQl/queries';
import faker from 'faker';
import { render, screen, act, fireEvent } from '@testing-library/react';
import MockApp from '@testUtils/MockApp';
import { MockedResponseType } from '@testUtils/MockAppWithGqlProvider';
import * as Monitoring from '@services/monitoring';
import Posts from './Posts';

jest.mock('@services/monitoring', () => {
  return {
    captureException: jest.fn(),
    captureScope: jest.fn(),
    Severity: {
      Error: 'error',
    },
  };
});

describe('Posts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render', async () => {
    const postsMock: MockedResponseType[] = [];
    await act(async () => {
      render(
        <MockApp mocks={postsMock}>
          <Posts />
        </MockApp>,
      );
    });
  });

  it('should display content as received from query', async () => {
    const items = [
      {
        heroImage: {
          title: faker.lorem.word(),
          url: faker.image.imageUrl(),
        },
        thumbnail: {
          title: faker.lorem.word(),
          url: faker.image.imageUrl(),
        },
        title: faker.lorem.word(),
        subtitle: faker.lorem.words(),
        description: faker.lorem.text(),
        category: faker.lorem.text(),
        slug: faker.random.word(),
        body: faker.lorem.paragraphs(),
        publishDate: faker.date.past().toISOString(),
        sys: {
          id: faker.datatype.uuid(),
        },
        contentfulMetadata: {
          tags: [
            {
              name: faker.lorem.word(),
              id: faker.datatype.uuid(),
            },
          ],
        },
        authorsCollection: {
          total: 1,
          items: [
            {
              sys: {
                id: faker.datatype.uuid(),
              },
            },
          ],
        },
      },
      {
        heroImage: {
          title: faker.lorem.word(),
          url: faker.image.imageUrl(),
        },
        thumbnail: {
          title: faker.lorem.word(),
          url: faker.image.imageUrl(),
        },
        title: faker.lorem.word(),
        subtitle: faker.lorem.words(),
        description: faker.lorem.text(),
        category: faker.lorem.text(),
        slug: faker.random.word(),
        body: faker.lorem.paragraphs(),
        publishDate: faker.date.past().toISOString(),
        sys: {
          id: faker.datatype.uuid(),
        },
        contentfulMetadata: {
          tags: [
            {
              name: faker.lorem.word(),
              id: faker.datatype.uuid(),
            },
          ],
        },
        authorsCollection: {
          total: 1,
          items: [
            {
              sys: {
                id: faker.datatype.uuid(),
              },
            },
          ],
        },
      },
    ];

    const postsMock: MockedResponseType[] = [
      {
        request: {
          query: GET_ALL_BLOGS,
          variables: {
            limit: 10,
          },
        },
        result: {
          data: {
            blogPostCollection: {
              items,
              total: items.length,
            },
          },
        },
      },
    ];

    await act(async () => {
      render(
        <MockApp mocks={postsMock}>
          <Posts />
        </MockApp>,
      );
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    items.forEach((item) => {
      const postTitleElement = screen.getByText(item.title);
      const postSubtitleElement = screen.getByText(item.subtitle);
      const heroImageElement = screen.getByAltText(item.heroImage.title);

      expect(postTitleElement).toBeInTheDocument();
      expect(postSubtitleElement).toBeInTheDocument();
      expect(heroImageElement.getAttribute('src')).toContain(item.heroImage.url);
    });
  });

  it('should display error if query fails to fetch content', async () => {
    const postsMock: MockedResponseType[] = [
      {
        request: {
          query: GET_ALL_BLOGS,
          variables: {
            limit: 10,
          },
        },
        error: {
          name: 'Error',
          message: faker.lorem.words(),
        },
        result: {
          data: undefined,
        },
      },
    ];

    await act(async () => {
      render(
        <MockApp mocks={postsMock}>
          <Posts />
        </MockApp>,
      );
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(Monitoring.captureException).toBeCalledTimes(1);
    expect(Monitoring.captureScope).toBeCalledTimes(1);
  });

  it('should handle fetchMore to display more data', async () => {
    const items = [
      {
        heroImage: {
          title: faker.lorem.word(),
          url: faker.image.imageUrl(),
        },
        thumbnail: {
          title: faker.lorem.word(),
          url: faker.image.imageUrl(),
        },
        title: faker.lorem.word(),
        subtitle: faker.lorem.words(),
        description: faker.lorem.text(),
        category: faker.lorem.text(),
        slug: faker.random.word(),
        body: faker.lorem.paragraphs(),
        publishDate: faker.date.past().toISOString(),
        sys: {
          id: faker.datatype.uuid(),
        },
        contentfulMetadata: {
          tags: [
            {
              name: faker.lorem.word(),
              id: faker.datatype.uuid(),
            },
          ],
        },
        authorsCollection: {
          total: 1,
          items: [
            {
              sys: {
                id: faker.datatype.uuid(),
              },
            },
          ],
        },
      },
      {
        heroImage: {
          title: faker.lorem.word(),
          url: faker.image.imageUrl(),
        },
        thumbnail: {
          title: faker.lorem.word(),
          url: faker.image.imageUrl(),
        },
        title: faker.lorem.word(),
        subtitle: faker.lorem.words(),
        description: faker.lorem.text(),
        category: faker.lorem.text(),
        slug: faker.random.word(),
        body: faker.lorem.paragraphs(),
        publishDate: faker.date.past().toISOString(),
        sys: {
          id: faker.datatype.uuid(),
        },
        contentfulMetadata: {
          tags: [
            {
              name: faker.lorem.word(),
              id: faker.datatype.uuid(),
            },
          ],
        },
        authorsCollection: {
          total: 1,
          items: [
            {
              sys: {
                id: faker.datatype.uuid(),
              },
            },
          ],
        },
      },
    ];

    const newItem = {
      heroImage: {
        title: faker.lorem.word(),
        url: faker.image.imageUrl(),
      },
      thumbnail: {
        title: faker.lorem.word(),
        url: faker.image.imageUrl(),
      },
      title: faker.lorem.word(),
      subtitle: faker.lorem.words(),
      description: faker.lorem.text(),
      slug: faker.random.word(),
      body: faker.lorem.paragraphs(),
      publishDate: faker.date.past().toISOString(),
      sys: {
        id: faker.datatype.uuid(),
      },
      contentfulMetadata: {
        tags: [
          {
            name: faker.lorem.word(),
            id: faker.datatype.uuid(),
          },
        ],
      },
      authorsCollection: {
        total: 1,
        items: [
          {
            sys: {
              id: faker.datatype.uuid(),
            },
          },
        ],
      },
    };

    const postsMock: MockedResponseType[] = [
      {
        request: {
          query: GET_ALL_BLOGS,
          variables: {
            limit: 10,
          },
        },
        error: undefined,
        newData: () => {
          return {
            data: {
              blogPostCollection: {
                items: [...items, newItem],
                total: items.length + 1,
              },
            },
          };
        },
        result: {
          data: {
            blogPostCollection: {
              items,
              total: items.length,
            },
          },
        },
      },
    ];

    await act(async () => {
      render(
        <MockApp mocks={postsMock}>
          <Posts />
        </MockApp>,
      );
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    const loadMoreBtn = screen.getByText('Load More');
    fireEvent.click(loadMoreBtn);

    const postTitleElement = screen.getByText(newItem.title);
    const postSubtitleElement = screen.getByText(newItem.subtitle);
    const heroImageElement = screen.getByAltText(newItem.heroImage.title);

    expect(postTitleElement).toBeInTheDocument();
    expect(postSubtitleElement).toBeInTheDocument();
    expect(heroImageElement.getAttribute('src')).toContain(newItem.heroImage.url);
  });
});
