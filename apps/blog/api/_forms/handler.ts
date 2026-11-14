import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { z } from 'zod';

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
// Resend answers in well under a second; past this, the reader gets an error instead of waiting
// for the platform to end the function.
const RESEND_TIMEOUT_MS = 10 * 1000;

/**
 * Counts requests per address in this function instance's memory. That makes it best-effort:
 * Vercel runs several instances and recycles them, each with its own count, so it slows down a
 * single client hammering one instance rather than enforcing a hard limit.
 */
function createRateLimiter() {
  const hits = new Map<string, { count: number; resetAt: number }>();
  let lastSweep = Date.now();

  return function isRateLimited(key: string): boolean {
    const now = Date.now();
    // Forget expired addresses once per window, so a long-lived instance only keeps recent ones.
    if (now - lastSweep > RATE_LIMIT_WINDOW_MS) {
      lastSweep = now;
      hits.forEach((hit, address) => hit.resetAt <= now && hits.delete(address));
    }
    const hit = hits.get(key);
    if (!hit || hit.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      return false;
    }
    hit.count += 1;
    return hit.count > RATE_LIMIT_MAX_REQUESTS;
  };
}

/**
 * The client's address. Vercel sets x-forwarded-for itself; on another host, the proxy in front
 * must overwrite it too, or a client can send a new value with each request.
 */
function clientAddress(request: VercelRequest): string {
  const forwarded = request.headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0].trim();
  return first || request.socket?.remoteAddress || 'unknown';
}

/** POSTs `body` as JSON to Resend's REST API. */
export function resend(path: string, apiKey: string, body: object) {
  return fetch(`https://api.resend.com${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
  });
}

type FormHandlerOptions<Schema extends z.ZodTypeAny, Env extends string> = {
  schema: Schema;
  /** The environment variables the form needs. The form answers 503 while any is missing. */
  env: readonly Env[];
  /** Sends the form to Resend. */
  deliver: (values: z.infer<Schema>, env: Record<Env, string>) => Promise<Response>;
  /** Whether an error answer from Resend still means the form went through. */
  isAlsoDelivered?: (status: number, body: string) => boolean;
};

/**
 * A function that takes a form POSTed as JSON, checks it against `schema` (the one the browser
 * validates with) and hands it to `deliver`.
 */
export function createFormHandler<Schema extends z.ZodTypeAny, Env extends string>({
  schema,
  env,
  deliver,
  isAlsoDelivered = () => false,
}: FormHandlerOptions<Schema, Env>) {
  const isRateLimited = createRateLimiter();

  return async function handler(request: VercelRequest, response: VercelResponse): Promise<VercelResponse> {
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      return response.status(405).json({ error: 'Method not allowed' });
    }

    const missing = env.filter(name => !process.env[name]);
    if (missing.length > 0) {
      console.error(`Form not configured, missing: ${missing.join(', ')}`);
      return response.status(503).json({ error: 'This form is not configured' });
    }

    if (isRateLimited(clientAddress(request))) {
      return response.status(429).json({ error: 'Too many requests, please try again later' });
    }

    // A filled honeypot gets the same answer as a delivered form, so bots learn nothing.
    if (request.body?.website) {
      // Logged so that readers whose autofill fills the honeypot show up.
      console.warn('Honeypot filled, form dropped');
      return response.status(200).json({ ok: true });
    }

    const result = schema.safeParse(request.body);
    if (!result.success) {
      return response.status(400).json({ error: 'Invalid request', fieldErrors: result.error.flatten().fieldErrors });
    }

    try {
      const values = Object.fromEntries(env.map(name => [name, process.env[name]])) as Record<Env, string>;
      const answer = await deliver(result.data, values);
      const body = answer.ok ? '' : await answer.text();
      if (answer.ok || isAlsoDelivered(answer.status, body)) {
        return response.status(200).json({ ok: true });
      }
      // What Resend said stays in the logs: it can name the account's addresses and settings.
      console.error(`Resend answered ${answer.status}: ${body}`);
    } catch (error) {
      console.error('Resend request failed', error);
    }
    return response.status(502).json({ error: 'Unable to send the form' });
  };
}
