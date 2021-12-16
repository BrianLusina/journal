import { GET_ABOUT_PAGES } from '@graphQl/queries';
import faker from 'faker';
import { render, screen, act } from '@testing-library/react';
import MockApp from '@testUtils/MockApp';
import { MockedResponseType } from '@testUtils/MockAppWithGqlProvider';
import AboutBlurb from './AboutBlurb';

describe('AboutBlurb', () => {
  it('should render', async () => {
    const aboutMock: MockedResponseType[] = [];
    await act(async () => {
      render(
        <MockApp mocks={aboutMock}>
          <AboutBlurb />
        </MockApp>,
      );
    });
  });

  it('should display content as received from query', async () => {
    const paragraph = faker.lorem.paragraph();
    const aboutMock: MockedResponseType[] = [
      {
        request: {
          query: GET_ABOUT_PAGES,
        },
        result: {
          data: {
            aboutCollection: {
              items: [
                {
                  title: 'About',
                  content: paragraph,
                },
              ],
            },
          },
        },
      },
    ];

    await act(async () => {
      render(
        <MockApp mocks={aboutMock}>
          <AboutBlurb />
        </MockApp>,
      );
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    const paragraphTextElement = screen.getByText(paragraph);

    expect(paragraphTextElement).toBeInTheDocument();
  });
});
