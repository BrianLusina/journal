import faker from 'faker';
import { render, act, screen } from '@testUtils/rtlUtils';
import * as Monitoring from '@services/monitoring';
import ArticlePage from './ArticlePage';
import { usePost } from '@hooks/cms/usePost';
import { MemoryRouter } from 'react-router-dom';

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

jest.mock('@hooks/cms/usePost');

describe('ArticlePage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state', async () => {
    (usePost as jest.Mock).mockReturnValue({
      data: null,
      loading: true,
      error: null,
    });
    await act(async () => {
      render(
        <ArticlePage />
      );
    });

    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
  });

  it('should display error if query fails to fetch article', async () => {
    const mockError = new Error(faker.lorem.words());
    
    (usePost as jest.Mock).mockReturnValue({
      data: null,
      loading: false,
      error: mockError,
    });

    await act(async () => {
      render(
        <ArticlePage />
      );
    });

    const errorMsg = await screen.findByText(/Yikes! Something terrible has happened/i);
    expect(errorMsg).toBeInTheDocument();

    expect(Monitoring.captureException).toBeCalledTimes(1);
    expect(Monitoring.captureScope).toBeCalledTimes(1);
  });
});
