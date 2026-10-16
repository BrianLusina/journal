import type { VercelRequest, VercelResponse } from '@vercel/node';

/** What the adapter reads from the Fetch API Request that Bun.serve passes. */
export type IncomingRequest = Pick<Request, 'method' | 'url' | 'headers' | 'text'>;

/** The default export of a file in api/. */
export type Handler = (request: VercelRequest, response: VercelResponse) => unknown;

/** What a handler answered, ready for `new Response(body, { status, headers })`. */
export interface HandlerResult {
  status: number;
  headers: [string, string][];
  body?: string;
}

/** The part of VercelRequest the adapter provides. */
interface ApiRequest {
  method: string;
  query: Record<string, string | string[]>;
  headers: Record<string, string>;
  body: unknown;
}

/** The part of VercelResponse the adapter provides. */
interface ApiResponse {
  status(code: number): ApiResponse;
  setHeader(name: string, value: string | number | readonly string[]): ApiResponse;
  json(body: unknown): ApiResponse;
  send(body: unknown): ApiResponse;
  end(body?: string): ApiResponse;
}

const JSON_TYPE = 'application/json; charset=utf-8';

/** The query string as Vercel parses it, plus the route's dynamic segments, which win. */
const parseQuery = (url: string, params: Record<string, string>): ApiRequest['query'] => {
  const query: ApiRequest['query'] = {};
  new URL(url).searchParams.forEach((value, key) => {
    const previous = query[key];
    query[key] = previous === undefined ? value : [...([] as string[]).concat(previous), value];
  });
  return { ...query, ...params };
};

/** A JSON body parsed, any other body as text, and no body as undefined. Throws on bad JSON. */
const parseBody = async (request: IncomingRequest): Promise<unknown> => {
  const text = await request.text();
  if (!text) return undefined;
  return request.headers.get('content-type')?.includes('application/json') ? JSON.parse(text) : text;
};

/** A response that records what the handler sends, as VercelResponse would send it. */
const createResponse = () => {
  const result = { status: 200, body: undefined as string | undefined };
  const headers = new Map<string, string[]>();
  const response: ApiResponse = {
    status(code) {
      result.status = code;
      return response;
    },
    setHeader(name, value) {
      headers.set(name.toLowerCase(), Array.isArray(value) ? [...value] : [String(value)]);
      return response;
    },
    json(body) {
      if (!headers.has('content-type')) response.setHeader('Content-Type', JSON_TYPE);
      return response.end(JSON.stringify(body));
    },
    send(body) {
      if (typeof body === 'object' && body !== null) return response.json(body);
      if (!headers.has('content-type')) response.setHeader('Content-Type', 'text/html; charset=utf-8');
      return response.end(String(body));
    },
    end(body) {
      result.body = body;
      return response;
    },
  };
  const toResult = (): HandlerResult => ({
    status: result.status,
    headers: [...headers].flatMap(([name, values]) => values.map((value): [string, string] => [name, value])),
    body: result.body,
  });
  return { response, toResult };
};

const errorResult = (status: number, error: string): HandlerResult => ({
  status,
  headers: [['content-type', JSON_TYPE]],
  body: JSON.stringify({ error }),
});

/**
 * Calls a Vercel function with the part of VercelRequest and VercelResponse the api/ handlers
 * use, and returns what it answered. `params` holds the route's dynamic segments.
 */
export async function invoke(
  handler: Handler,
  request: IncomingRequest,
  params: Record<string, string>,
): Promise<HandlerResult> {
  let body: unknown;
  try {
    body = await parseBody(request);
  } catch {
    return errorResult(400, 'Invalid JSON body');
  }
  const apiRequest: ApiRequest = {
    method: request.method,
    query: parseQuery(request.url, params),
    headers: Object.fromEntries(request.headers),
    body,
  };
  const { response, toResult } = createResponse();
  try {
    // The handlers only use the members ApiRequest and ApiResponse provide.
    await handler(apiRequest as unknown as VercelRequest, response as unknown as VercelResponse);
  } catch (error) {
    console.error(error);
    return errorResult(500, 'Internal server error');
  }
  return toResult();
}
