import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SubscribeForm from './SubscribeForm';

const answer = (status: number) => ({ ok: status >= 200 && status < 300, status });

const subscribe = async (email: string) => {
  const user = userEvent.setup();
  render(<SubscribeForm />);
  await user.type(screen.getByLabelText('Email address'), email);
  await user.click(screen.getByRole('button', { name: 'Subscribe' }));
};

describe('SubscribeForm', () => {
  it('confirms the subscription once the function answers 2xx', async () => {
    global.fetch = jest.fn().mockResolvedValue(answer(200));

    await subscribe('ada@example.com');

    expect(await screen.findByText(/thanks for subscribing/i)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/subscribe', expect.objectContaining({ method: 'POST' }));
    expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)).toEqual({
      email: 'ada@example.com',
      website: '',
    });
    expect(screen.getByLabelText('Email address')).toHaveValue('');
  });

  it('shows an error and keeps the address when the function fails', async () => {
    global.fetch = jest.fn().mockResolvedValue(answer(502));

    await subscribe('ada@example.com');

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't subscribe you/i);
    expect(screen.getByLabelText('Email address')).toHaveValue('ada@example.com');
    expect(screen.queryByText(/thanks for subscribing/i)).not.toBeInTheDocument();
  });

  it('disables the button while the subscription is sent', async () => {
    let finish: (value: unknown) => void = () => {};
    global.fetch = jest.fn().mockReturnValue(new Promise(resolve => { finish = resolve; }));

    await subscribe('ada@example.com');

    expect(screen.getByRole('button', { name: /subscribing/i })).toBeDisabled();
    finish(answer(200));
    expect(await screen.findByRole('button', { name: 'Subscribe' })).toBeEnabled();
  });

  it('links the validation error to the field and sends nothing', async () => {
    global.fetch = jest.fn();

    await subscribe('not-an-email');

    const input = screen.getByLabelText('Email address');
    expect(await screen.findByText('Please enter a valid email address.')).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Please enter a valid email address.');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
