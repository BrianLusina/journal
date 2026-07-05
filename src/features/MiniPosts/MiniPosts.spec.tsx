import { GET_ALL_BLOGS } from '@graphQl/queries';
import faker from 'faker';
import { render, screen, act } from '@testing-library/react';
import MockApp from '@testUtils/MockApp';
import { MockedResponseType } from '@testUtils/MockAppWithGqlProvider';
import * as Monitoring from '@services/monitoring';
import MiniPosts from './MiniPosts';

jest.mock('@services/monitoring', () => {
  return {
    captureException: jest.fn(),
    captureScope: jest.fn(),
    Severity: {
      Error: 'error',
    },
  };
});

describe('MiniPosts', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render', async () => {
    const miniPostsMock: MockedResponseType[] = [
      {
        request: {
          query: GET_ALL_BLOGS,
          variables: { limit: 5 },
        },
        result: {
          data: {
            blogPostCollection: {
              total: 0,
              limit: 5,
              items: [],
            },
          },
        },
      },
    ];
    await act(async () => {
      render(
        <MockApp mocks={miniPostsMock}>
          <MiniPosts />
        </MockApp>,
      );
    });
  });

  it('should display content as received from query', async () => {
    const items = [
      {
        __typename: 'BlogPost',
        heroImage: {
          __typename: 'Asset',
          contentfulMetadata: {
            __typename: 'ContentfulMetadata',
            concepts: [],
            tags: [
              {
                __typename: 'ContentfulTag',
                name: faker.lorem.word(),
                id: faker.datatype.uuid(),
              },
            ],
          },
          contentType: 'image/jpeg',
          description: faker.lorem.sentence(),
          fileName: 'image.jpg',
          height: 100,
          size: 1000,
          sys: {
            __typename: 'Sys',
            environmentId: 'master',
            firstPublishedAt: faker.date.past().toISOString(),
            id: faker.datatype.uuid(),
            locale: 'en-US',
            publishedAt: faker.date.past().toISOString(),
            publishedVersion: 1,
            spaceId: 'space-123',
          },
          title: faker.lorem.word(),
          url: faker.image.imageUrl(),
          width: 100,
        },
        thumbnail: {
          __typename: 'Asset',
          contentfulMetadata: {
            __typename: 'ContentfulMetadata',
            concepts: [],
            tags: [
              {
                __typename: 'ContentfulTag',
                name: faker.lorem.word(),
                id: faker.datatype.uuid(),
              },
            ],
          },
          contentType: 'image/jpeg',
          description: faker.lorem.sentence(),
          fileName: 'image.jpg',
          height: 100,
          size: 1000,
          sys: {
            __typename: 'Sys',
            environmentId: 'master',
            firstPublishedAt: faker.date.past().toISOString(),
            id: faker.datatype.uuid(),
            locale: 'en-US',
            publishedAt: faker.date.past().toISOString(),
            publishedVersion: 1,
            spaceId: 'space-123',
          },
          title: faker.lorem.word(),
          url: faker.image.imageUrl(),
          width: 100,
        },
        title: 'Some Title',
        subtitle: faker.lorem.words(),
        description: faker.lorem.text(),
        category: faker.lorem.text(),
        slug: faker.random.word(),
        body: faker.lorem.paragraphs(),
        publishDate: faker.date.past().toISOString(),
        sys: {
            __typename: 'Sys',
            environmentId: 'master',
          firstPublishedAt: faker.date.past().toISOString(),
          id: faker.datatype.uuid(),
          locale: 'en-US',
          publishedAt: faker.date.past().toISOString(),
          publishedVersion: 1,
          spaceId: 'space-123',
          },
          contentfulMetadata: {
            __typename: 'ContentfulMetadata',
            concepts: [],
            tags: [
              {
                __typename: 'ContentfulTag',
                name: faker.lorem.word(),
                id: faker.datatype.uuid(),
              },
            ],
          },
        authorsCollection: {
          __typename: 'BlogPostAuthorsCollection',
          total: 1,
          items: [
            {
              __typename: 'Person',
              sys: {
                __typename: 'Sys',
                id: faker.datatype.uuid(),
              },
            },
          ],
        },
      },
      {
        __typename: 'BlogPost',
        heroImage: {
          __typename: 'Asset',
          contentfulMetadata: {
            __typename: 'ContentfulMetadata',
            concepts: [],
          tags: [
            {
              __typename: 'ContentfulTag',
              name: faker.lorem.word(),
              id: faker.datatype.uuid(),
            },
          ],
          },
          contentType: 'image/jpeg',
          description: faker.lorem.sentence(),
          fileName: 'image.jpg',
          height: 100,
          size: 1000,
          sys: {
            __typename: 'Sys',
            environmentId: 'master',
          firstPublishedAt: faker.date.past().toISOString(),
          id: faker.datatype.uuid(),
          locale: 'en-US',
          publishedAt: faker.date.past().toISOString(),
          publishedVersion: 1,
          spaceId: 'space-123',
          },
          title: faker.lorem.word(),
          url: faker.image.imageUrl(),
          width: 100,
        },
        thumbnail: {
          __typename: 'Asset',
          contentfulMetadata: {
            __typename: 'ContentfulMetadata',
            concepts: [],
          tags: [
            {
              __typename: 'ContentfulTag',
              name: faker.lorem.word(),
              id: faker.datatype.uuid(),
            },
          ],
          },
          contentType: 'image/jpeg',
          description: faker.lorem.sentence(),
          fileName: 'image.jpg',
          height: 100,
          size: 1000,
          sys: {
            __typename: 'Sys',
            environmentId: 'master',
          firstPublishedAt: faker.date.past().toISOString(),
          id: faker.datatype.uuid(),
          locale: 'en-US',
          publishedAt: faker.date.past().toISOString(),
          publishedVersion: 1,
          spaceId: 'space-123',
          },
          title: faker.lorem.word(),
          url: faker.image.imageUrl(),
          width: 100,
        },
        title: 'other title',
        subtitle: faker.lorem.words(),
        description: faker.lorem.text(),
        category: faker.lorem.text(),
        slug: faker.random.word(),
        body: faker.lorem.paragraphs(),
        publishDate: faker.date.past().toISOString(),
        sys: {
            __typename: 'Sys',
            environmentId: 'master',
          firstPublishedAt: faker.date.past().toISOString(),
          id: faker.datatype.uuid(),
          locale: 'en-US',
          publishedAt: faker.date.past().toISOString(),
          publishedVersion: 1,
          spaceId: 'space-123',
          },
          contentfulMetadata: {
            __typename: 'ContentfulMetadata',
            concepts: [],
            tags: [
              {
                __typename: 'ContentfulTag',
                name: faker.lorem.word(),
                id: faker.datatype.uuid(),
              },
            ],
          },
        authorsCollection: {
          __typename: 'BlogPostAuthorsCollection',
          total: 1,
          items: [
            {
              __typename: 'Person',
              sys: {
                __typename: 'Sys',
                id: faker.datatype.uuid(),
              },
            },
          ],
        },
      },
    ];

    const miniPostsMock: MockedResponseType[] = [
      {
        request: {
          query: GET_ALL_BLOGS,
          variables: {
            limit: 5,
          },
        },
        result: {
          data: {
            blogPostCollection: {
              total: items.length,
              limit: 5,
              items,
            },
          },
        },
      },
    ];

    await act(async () => {
      const { debug } = render(
        <MockApp mocks={miniPostsMock}>
          <MiniPosts />
        </MockApp>,
      );

      debug();
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    for (const item of items) {
      const postTitleElement = await screen.findByText(item.title);
      expect(postTitleElement).toBeInTheDocument();
    }
  });

  it('should display error if query fails to fetch content', async () => {
    const miniPostsMock: MockedResponseType[] = [
      {
        request: {
          query: GET_ALL_BLOGS,
          variables: {
            limit: 5,
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
        <MockApp mocks={miniPostsMock}>
          <MiniPosts />
        </MockApp>,
      );
    });

    const errorMsg = await screen.findByText(/Yikes! Something terrible has happened/i);
    expect(errorMsg).toBeInTheDocument();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(Monitoring.captureException).toBeCalledTimes(1);
    expect(Monitoring.captureScope).toBeCalledTimes(1);
  });
});
