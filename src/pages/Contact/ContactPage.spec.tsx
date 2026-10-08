import { render, screen } from '@testing-library/react';
import { GET_SOCIAL_INFO } from '@contentfulClient';
import MockApp from '@testUtils/MockApp';
import { MockedResponseType } from '@testUtils/MockAppWithGqlProvider';
import ContactPage from './ContactPage';

const socialMock: MockedResponseType[] = [
  {
    request: { query: GET_SOCIAL_INFO },
    result: {
      data: { socialCollection: { items: [{ name: 'Twitter', link: 'https://twitter.com/example' }] } },
    },
  },
];

// Waits for the social links so the assertions below see the fully loaded page.
const renderPage = async () => {
  const view = render(
    <MockApp mocks={socialMock}>
      <ContactPage />
    </MockApp>,
  );
  await screen.findByRole('link', { name: 'Twitter' });
  return view;
};

describe('ContactPage', () => {
  // There is no backend to send messages to yet, so the page must not offer a form that
  // pretends to send one.
  it('renders no message form and never claims a message was sent', async () => {
    const { container } = await renderPage();

    expect(container.querySelector('form')).toBeNull();
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: /send/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/message sent/i)).not.toBeInTheDocument();
  });

  it('links to the social accounts from Contentful', async () => {
    await renderPage();

    expect(screen.getByRole('link', { name: 'Twitter' })).toHaveAttribute(
      'href',
      'https://twitter.com/example',
    );
  });

  it('does not show placeholder contact details nobody answers', async () => {
    await renderPage();

    expect(screen.queryByText(/@journal\.blog/)).not.toBeInTheDocument();
    expect(screen.queryByText(/555/)).not.toBeInTheDocument();
    expect(screen.queryByText(/use the form/i)).not.toBeInTheDocument();
  });
});
