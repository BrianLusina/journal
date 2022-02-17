import { GET_SOCIAL_INFO } from '@graphQl/queries';
import faker from 'faker';
import { render, screen, act } from '@testing-library/react';
import MockApp from '@testUtils/MockApp';
import { MockedResponseType } from '@testUtils/MockAppWithGqlProvider';
import Social from './Social';

describe('Social', () => {
  it('should render', async () => {
    const socialMock: MockedResponseType[] = [];
    await act(async () => {
      render(
        <MockApp mocks={socialMock}>
          <Social />
        </MockApp>,
      );
    });
  });

  it('should display content as received from query', async () => {
    const name = faker.lorem.word();
    const link = faker.internet.url();

    const socialMock: MockedResponseType[] = [
      {
        request: {
          query: GET_SOCIAL_INFO,
        },
        result: {
          data: {
            socialCollection: {
              items: [
                {
                  name,
                  link,
                },
              ],
            },
          },
        },
      },
    ];

    await act(async () => {
      render(
        <MockApp mocks={socialMock}>
          <Social />
        </MockApp>,
      );
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    const nameTextElement = screen.getByText(name);
    const linkElement = screen.getByRole('link');

    expect(nameTextElement).toBeInTheDocument();
    expect(linkElement).toBeInTheDocument();
  });
});
