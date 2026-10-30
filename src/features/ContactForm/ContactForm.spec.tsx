import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactForm from './ContactForm';

const answer = (status: number) => ({ ok: status >= 200 && status < 300, status });

const fillAndSend = async () => {
  const user = userEvent.setup();
  render(<ContactForm />);
  await user.type(screen.getByLabelText('Name'), 'Ada');
  await user.type(screen.getByLabelText('Email'), 'ada@example.com');
  await user.type(screen.getByLabelText(/Subject/), 'Hello');
  await user.type(screen.getByLabelText('Message'), 'Lovely site.');
  await user.click(screen.getByRole('button', { name: 'Send Message' }));
};

describe('ContactForm', () => {
  it('confirms the message once the function answers 2xx, and clears the form', async () => {
    global.fetch = jest.fn().mockResolvedValue(answer(200));

    await fillAndSend();

    expect(await screen.findByText(/your message has been sent/i)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/contact', expect.objectContaining({ method: 'POST' }));
    expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)).toEqual({
      name: 'Ada',
      email: 'ada@example.com',
      subject: 'Hello',
      message: 'Lovely site.',
      website: '',
    });
    expect(screen.getByLabelText('Name')).toHaveValue('');
    expect(screen.getByLabelText('Message')).toHaveValue('');
  });

  it('shows an error and keeps what the reader wrote when the function fails', async () => {
    global.fetch = jest.fn().mockResolvedValue(answer(502));

    await fillAndSend();

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't send your message/i);
    expect(screen.getByLabelText('Name')).toHaveValue('Ada');
    expect(screen.getByLabelText('Email')).toHaveValue('ada@example.com');
    expect(screen.getByLabelText(/Subject/)).toHaveValue('Hello');
    expect(screen.getByLabelText('Message')).toHaveValue('Lovely site.');
    expect(screen.queryByText(/your message has been sent/i)).not.toBeInTheDocument();
  });

  it('disables the button while the message is sent', async () => {
    let finish: (value: unknown) => void = () => {};
    global.fetch = jest.fn().mockReturnValue(new Promise(resolve => { finish = resolve; }));

    await fillAndSend();

    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
    finish(answer(200));
    expect(await screen.findByRole('button', { name: 'Send Message' })).toBeEnabled();
  });

  it('links each validation error to its field and sends nothing', async () => {
    global.fetch = jest.fn();
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Send Message' }));

    expect(await screen.findByLabelText('Name')).toHaveAccessibleDescription('Please enter your name.');
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Please enter a valid email address.');
    expect(screen.getByLabelText('Message')).toHaveAccessibleDescription('Please enter a message.');
    ['Name', 'Email', 'Message'].forEach(label =>
      expect(screen.getByLabelText(label)).toHaveAttribute('aria-invalid', 'true'),
    );
    expect(screen.getByLabelText(/Subject/)).toHaveAttribute('aria-invalid', 'false');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
