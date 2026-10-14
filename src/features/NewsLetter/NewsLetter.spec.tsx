import { render, screen } from '@testing-library/react';
import NewsLetterSection from './NewsLetter';

describe('NewsLetterSection', () => {
  it('offers the newsletter signup', () => {
    render(<NewsLetterSection />);

    expect(screen.getByRole('heading', { name: 'Stay inspired.' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument();
  });
});
