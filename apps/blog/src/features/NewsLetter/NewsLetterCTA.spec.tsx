import { render, screen } from '@testing-library/react';
import NewsLetterCTA from './NewsLetterCTA';

describe('NewsLetterCTA', () => {
  it('offers the newsletter signup after an article', () => {
    render(<NewsLetterCTA />);

    expect(screen.getByRole('heading', { name: 'Enjoyed this article?' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument();
  });

  it('takes its own title and description', () => {
    render(<NewsLetterCTA title="Join Our Community" description="Get new articles by email." />);

    expect(screen.getByRole('heading', { name: 'Join Our Community' })).toBeInTheDocument();
    expect(screen.getByText('Get new articles by email.')).toBeInTheDocument();
  });
});
