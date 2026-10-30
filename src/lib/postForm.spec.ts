import { postForm } from './postForm';

describe('postForm', () => {
  it('POSTs the values as JSON', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });

    await postForm('/api/subscribe', { email: 'ada@example.com' });

    expect(global.fetch).toHaveBeenCalledWith('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"email":"ada@example.com"}',
    });
  });

  it('rejects when the function answers with an error', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 502 });

    await expect(postForm('/api/subscribe', {})).rejects.toThrow('/api/subscribe answered 502');
  });
});
