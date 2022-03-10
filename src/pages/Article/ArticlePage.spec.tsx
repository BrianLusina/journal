import { GET_BLOG } from '@graphQl/queries';
import faker from 'faker';
import { render, act } from '@testUtils/rtlUtils';
import { MockedResponseType } from '@testUtils/MockAppWithGqlProvider';
import * as Monitoring from '@services/monitoring';
import ArticlePage from './ArticlePage';

jest.mock('@services/monitoring', () => {
  return {
    captureException: jest.fn(),
    captureScope: jest.fn(),
    Severity: {
      Error: 'error',
    },
  };
});

// eslint-disable-next-line @typescript-eslint/no-empty-function
jest.mock('remark-gfm', () => () => {});

describe('ArticlePage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render', async () => {
    const articlePostMock: MockedResponseType[] = [];
    await act(async () => {
      render(<ArticlePage />, {
        mocks: articlePostMock,
      });
    });
  });

  it('should display error if query fails to fetch article', async () => {
    const articlePostMock: MockedResponseType[] = [
      {
        request: {
          query: GET_BLOG,
          variables: {
            id: 5,
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
      render(<ArticlePage />, {
        mocks: articlePostMock,
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(Monitoring.captureException).toBeCalledTimes(1);
    expect(Monitoring.captureScope).toBeCalledTimes(1);
  });
});
