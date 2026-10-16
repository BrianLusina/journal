import type { VercelRequest, VercelResponse } from '@vercel/node';
import { invoke, type IncomingRequest } from './adapter';

/** A Fetch API Request, as Bun.serve passes it, reduced to what the adapter reads. */
const request = (
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string } = {},
): IncomingRequest => ({
  method: init.method ?? 'GET',
  url,
  headers: new Headers(init.headers),
  text: async () => init.body ?? '',
});

/** Runs handler on request and returns the request the handler saw. */
const requestSeenBy = async (
  incoming: IncomingRequest,
  params: Record<string, string> = {},
  remoteAddress?: string,
) => {
  let seen: VercelRequest | undefined;
  await invoke(
    req => {
      seen = req;
    },
    incoming,
    params,
    remoteAddress,
  );
  return seen as VercelRequest;
};

describe('Vercel adapter', () => {
  describe('request', () => {
    it('passes the method, the headers and the query, with repeated keys as arrays', async () => {
      const req = await requestSeenBy(
        request('http://localhost/api/notion/posts?limit=5&tag=a&tag=b', {
          headers: { 'X-Custom': 'value' },
        }),
      );

      expect(req.method).toBe('GET');
      expect(req.headers['x-custom']).toBe('value');
      expect(req.query).toEqual({ limit: '5', tag: ['a', 'b'] });
    });

    it('adds the dynamic path segments to the query, over a query key of the same name', async () => {
      const req = await requestSeenBy(request('http://localhost/api/notion/posts/real?slug=fake&x=1'), {
        slug: 'real',
      });

      expect(req.query).toEqual({ slug: 'real', x: '1' });
    });

    // The form functions rate-limit by the first x-forwarded-for entry, then the socket address.
    it('passes x-forwarded-for through as sent', async () => {
      const req = await requestSeenBy(
        request('http://localhost/api/contact', {
          method: 'POST',
          headers: { 'X-Forwarded-For': '198.51.100.1, 10.0.0.1' },
        }),
      );

      expect(req.headers['x-forwarded-for']).toBe('198.51.100.1, 10.0.0.1');
    });

    it("passes the client's address as req.socket.remoteAddress", async () => {
      const req = await requestSeenBy(request('http://localhost/api/contact'), {}, '203.0.113.7');

      expect(req.socket.remoteAddress).toBe('203.0.113.7');
    });

    it('parses a JSON body', async () => {
      const req = await requestSeenBy(
        request('http://localhost/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: '{"email":"reader@example.com"}',
        }),
      );

      expect(req.body).toEqual({ email: 'reader@example.com' });
    });

    it('leaves a body not sent as JSON for the handler to reject, as the form functions do', async () => {
      const result = await invoke(
        (req, res) =>
          typeof req.body === 'object' ? res.json({ ok: true }) : res.status(400).json({ error: 'Invalid request' }),
        request('http://localhost/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: '{"email":"reader@example.com"}',
        }),
        {},
      );

      expect(result.status).toBe(400);
      expect(JSON.parse(result.body as string)).toEqual({ error: 'Invalid request' });
    });

    it('passes any other body as text, and no body as undefined', async () => {
      const text = await requestSeenBy(
        request('http://localhost/api/contact', { method: 'POST', body: 'hello' }),
      );
      const empty = await requestSeenBy(request('http://localhost/api/contact', { method: 'POST' }));
      const get = await requestSeenBy(request('http://localhost/api/contact'));

      expect(text.body).toBe('hello');
      expect(empty.body).toBeUndefined();
      expect(get.body).toBeUndefined();
    });

    it('answers 400 to malformed JSON without calling the handler', async () => {
      const handler = jest.fn();

      const result = await invoke(
        handler,
        request('http://localhost/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{not json',
        }),
        {},
      );

      expect(handler).not.toHaveBeenCalled();
      expect(result.status).toBe(400);
      expect(JSON.parse(result.body as string)).toEqual({ error: 'Invalid JSON body' });
    });
  });

  describe('response', () => {
    const respond = (handler: (res: VercelResponse) => unknown) =>
      invoke((_req, res) => handler(res), request('http://localhost/api/x'), {});

    it('sends status(...).json(...) as JSON with that status', async () => {
      const result = await respond(res => res.status(405).json({ error: 'Method not allowed' }));

      expect(result.status).toBe(405);
      expect(result.headers).toEqual([['content-type', 'application/json; charset=utf-8']]);
      expect(JSON.parse(result.body as string)).toEqual({ error: 'Method not allowed' });
    });

    it('defaults to 200', async () => {
      const result = await respond(res => res.json({ ok: true }));

      expect(result.status).toBe(200);
    });

    it('sends the headers set with setHeader, the last value of a name winning', async () => {
      const result = await respond(res => {
        res.setHeader('Allow', 'POST');
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('cache-control', 's-maxage=60');
        res.setHeader('Content-Type', 'application/problem+json');
        res.setHeader('Set-Cookie', ['a=1', 'b=2']);
        res.status(201).json({});
      });

      expect(result.headers).toEqual([
        ['allow', 'POST'],
        ['cache-control', 's-maxage=60'],
        ['content-type', 'application/problem+json'],
        ['set-cookie', 'a=1'],
        ['set-cookie', 'b=2'],
      ]);
    });

    it('sends a string with send() as HTML and an object as JSON', async () => {
      const text = await respond(res => res.send('<p>ok</p>'));
      const object = await respond(res => res.send({ ok: true }));

      expect(text.headers).toEqual([['content-type', 'text/html; charset=utf-8']]);
      expect(text.body).toBe('<p>ok</p>');
      expect(object.headers).toEqual([['content-type', 'application/json; charset=utf-8']]);
      expect(object.body).toBe('{"ok":true}');
    });

    it('sends end() with or without a body', async () => {
      const withoutBody = await respond(res => res.status(204).end());
      const withBody = await respond(res => res.end('done'));

      expect(withoutBody).toEqual({ status: 204, headers: [], body: undefined });
      expect(withBody).toEqual({ status: 200, headers: [], body: 'done' });
    });

    it('answers 500 when the handler throws', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);

      const result = await respond(() => Promise.reject(new Error('boom')));

      expect(result.status).toBe(500);
      expect(JSON.parse(result.body as string)).toEqual({ error: 'Internal server error' });
      expect(console.error).toHaveBeenCalled();
    });
  });
});
