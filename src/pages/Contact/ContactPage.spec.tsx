import { toast } from 'sonner';
import { render, screen, userEvent } from '@testUtils/rtlUtils';
import ContactPage from './ContactPage';

jest.mock('sonner', () => ({ toast: { success: jest.fn() } }));

describe('ContactPage', () => {
  it('confirms and clears the form on submit', () => {
    render(<ContactPage />);

    userEvent.type(screen.getByLabelText('Name'), 'Ada');
    userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
    userEvent.type(screen.getByLabelText('Subject'), 'Hello');
    userEvent.type(screen.getByLabelText('Message'), 'Lovely site.');
    userEvent.click(screen.getByRole('button', { name: /send/i }));

    // The form is not wired to a backend yet; it only confirms locally.
    expect(toast.success).toHaveBeenCalledWith("Message sent! We'll get back to you soon.");
    expect(screen.getByLabelText('Name')).toHaveValue('');
    expect(screen.getByLabelText('Message')).toHaveValue('');
  });
});
