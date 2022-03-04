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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render', async () => {
    const miniPostsMock: MockedResponseType[] = [];
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
        heroImage: {
          title: faker.lorem.word(),
          url: faker.image.imageUrl(),
        },
        thumbnail: {
          title: 'thumbnail title',
          url: faker.image.imageUrl(),
        },
        title: 'Some Title',
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
        // authorsCollection: AuthorCollection;
      },
      {
        heroImage: {
          title: faker.lorem.word(),
          url: faker.image.imageUrl(),
        },
        thumbnail: {
          title: 'thumnail title 2',
          url: faker.image.imageUrl(),
        },
        title: 'other title',
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
        // authorsCollection: AuthorCollection;
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
              items,
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

    await new Promise((resolve) => setTimeout(resolve, 0));

    items.forEach((item) => {
      const postTitleElement = screen.getByText(item.title);
      const thumbnailImageElement = screen.getByAltText(item.thumbnail.title);

      expect(postTitleElement).toBeInTheDocument();
      expect(thumbnailImageElement.getAttribute('src')).toContain(item.heroImage.url);
    });
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

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(Monitoring.captureException).toBeCalledTimes(1);
    expect(Monitoring.captureScope).toBeCalledTimes(1);
  });
});
