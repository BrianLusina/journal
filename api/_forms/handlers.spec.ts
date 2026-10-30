import type { VercelRequest, VercelResponse } from '@vercel/node';
import contactHandler from '../contact';
import subscribeHandler from '../subscribe';

type Handler = (request: VercelRequest, response: VercelResponse) => Promise<unknown>;

const formResponse = () => {
  const res = { status: jest.fn(), json: jest.fn(), setHeader: jest.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
};

// Each request comes from its own address unless one is given, because the rate limit
// outlives a single test.
let lastAddress = 0;
const formRequest = (body: unknown, { method = 'POST', ip = `203.0.113.${++lastAddress}` } = {}) =>
  ({ method, body, headers: { 'x-forwarded-for': `${ip}, 10.0.0.1` } }) as unknown as VercelRequest;

const send = async (handler: Handler, request: VercelRequest) => {
  const res = formResponse();
  await handler(request, res as unknown as VercelResponse);
  return res;
};

/** What fetch resolves to when Resend answers with `status` and the JSON `body`. */
const resendAnswer = (status: number, body: object) => ({
  ok: status >= 200 && status < 300,
  status,
  text: () => Promise.resolve(JSON.stringify(body)),
});

const fetchMock = () => global.fetch as jest.Mock;

const contactEnv = {
  RESEND_API_KEY: 're_test',
  CONTACT_TO_EMAIL: 'owner@example.com',
  CONTACT_FROM_EMAIL: 'Journal <forms@example.com>',
};
const subscribeEnv = { RESEND_API_KEY: 're_test', RESEND_AUDIENCE_ID: 'aud_123' };

const message = { name: 'Ada', email: 'ada@example.com', subject: 'Hello', message: 'Lovely site.', website: '' };
const subscription = { email: 'ada@example.com', website: '' };

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv, ...contactEnv, ...subscribeEnv };
  global.fetch = jest.fn().mockResolvedValue(resendAnswer(200, { id: 'resend-1' }));
  // Node has AbortSignal.timeout; Jest's jsdom does not.
  AbortSignal.timeout = jest.fn(() => new AbortController().signal);
});

afterAll(() => {
  process.env = originalEnv;
});

describe.each([
  ['/api/contact', contactHandler as Handler, message, contactEnv, ['email', 'message', 'name']],
  ['/api/subscribe', subscribeHandler as Handler, subscription, subscribeEnv, ['email']],
])('POST %s', (_, handler, validBody, env, requiredFields) => {
  it('answers 405 to anything but POST', async () => {
    const res = await send(handler, formRequest(undefined, { method: 'GET' }));

    expect(res.setHeader).toHaveBeenCalledWith('Allow', 'POST');
    expect(res.status).toHaveBeenCalledWith(405);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('answers 400 with the errors of each invalid field', async () => {
    const invalid = Object.fromEntries(requiredFields.map(field => [field, field === 'email' ? 'not-an-email' : '   ']));

    const res = await send(handler, formRequest(invalid));

    expect(res.status).toHaveBeenCalledWith(400);
    const { error, fieldErrors } = res.json.mock.calls[0][0];
    expect(error).toBe('Invalid request');
    expect(Object.keys(fieldErrors).sort()).toEqual(requiredFields);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('answers 400 to a body that is not a JSON object', async () => {
    const res = await send(handler, formRequest('email=ada@example.com'));

    expect(res.status).toHaveBeenCalledWith(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('answers 200 to a filled honeypot without sending anything', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const res = await send(handler, formRequest({ ...validBody, website: 'https://spam.example' }));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('answers 429 once an address has sent too many requests', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 6; i += 1) {
      const res = await send(handler, formRequest(validBody, { ip: '198.51.100.7' }));
      statuses.push(res.status.mock.calls[0][0]);
    }

    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
    expect(global.fetch).toHaveBeenCalledTimes(5);
    // Other readers are not limited by it.
    expect((await send(handler, formRequest(validBody))).status).toHaveBeenCalledWith(200);
  });

  it.each(Object.keys(env))('answers 503, and logs the variable, when %s is not set', async name => {
    delete process.env[name];
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    const res = await send(handler, formRequest(validBody));

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ error: 'This form is not configured' });
    expect(error).toHaveBeenCalledWith(`Form not configured, missing: ${name}`);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it.each([
    ['answers with an error', () => Promise.resolve(resendAnswer(422, { message: 'Invalid `from` field: forms@example.com' }))],
    ['cannot be reached', () => Promise.reject(new Error('network down'))],
  ])('answers 502, without passing on what Resend said, when Resend %s', async (__, resend) => {
    fetchMock().mockImplementation(resend);
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const res = await send(handler, formRequest(validBody));

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unable to send the form' });
  });
});

describe('POST /api/contact', () => {
  it('emails the message to the owner through Resend, with replies going to the reader', async () => {
    const res = await send(contactHandler, formRequest(message));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock().mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ Authorization: 'Bearer re_test', 'Content-Type': 'application/json' });
    // A stalled Resend ends in a 502 rather than holding the function until the platform stops it.
    expect(AbortSignal.timeout).toHaveBeenCalledWith(10000);
    expect(init.signal).toBe((AbortSignal.timeout as jest.Mock).mock.results[0].value);
    expect(JSON.parse(init.body)).toEqual({
      from: 'Journal <forms@example.com>',
      to: 'owner@example.com',
      reply_to: 'ada@example.com',
      subject: 'Contact form: Hello',
      text: 'From: Ada <ada@example.com>\n\nLovely site.',
    });
  });

  it('names the sender in the subject when the reader leaves it empty', async () => {
    await send(contactHandler, formRequest({ ...message, subject: '' }));

    const { subject } = JSON.parse(fetchMock().mock.calls[0][1].body);
    expect(subject).toBe('Contact form: message from Ada');
  });
});

describe('POST /api/subscribe', () => {
  it('adds the reader to the Resend audience', async () => {
    const res = await send(subscribeHandler, formRequest(subscription));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
    const [url, init] = fetchMock().mock.calls[0];
    expect(url).toBe('https://api.resend.com/audiences/aud_123/contacts');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ Authorization: 'Bearer re_test', 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body)).toEqual({ email: 'ada@example.com' });
  });

  // Answering differently would tell anyone whether an address is subscribed.
  it.each([
    ['a 409', resendAnswer(409, { name: 'conflict', message: 'Contact already exists' })],
    ['an "already exists" error', resendAnswer(422, { name: 'validation_error', message: 'Contact already exists in this audience' })],
  ])('answers 200 when Resend reports the contact already exists with %s', async (_, answer) => {
    fetchMock().mockResolvedValue(answer);

    const res = await send(subscribeHandler, formRequest(subscription));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });
});
