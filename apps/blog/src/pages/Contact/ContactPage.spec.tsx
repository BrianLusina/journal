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
  // Sending and its outcomes are covered by ContactForm.spec.tsx.
  it('offers the contact form', async () => {
    await renderPage();

    expect(screen.getByRole('heading', { name: 'Send us a message' })).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Message' })).toBeInTheDocument();
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
  });
});
