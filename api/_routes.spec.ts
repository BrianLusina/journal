import type { VercelResponse } from '@vercel/node';
import { getLimit, getParam, methodNotAllowed } from './_routes';

describe('getLimit', () => {
  it.each([
    [undefined, 100],
    ['abc', 100],
    ['10', 10],
    ['2.9', 2],
    ['0', 1],
    ['-5', 1],
    ['500', 100],
  ])('turns %p into %p', (value, expected) => {
    expect(getLimit(value)).toBe(expected);
  });
});

describe('getParam', () => {
  it.each([
    ['cursor-1', 'cursor-1'],
    ['', undefined],
    [undefined, undefined],
    [['a', 'b'], undefined],
  ])('turns %p into %p', (value, expected) => {
    expect(getParam(value)).toBe(expected);
  });
});

describe('methodNotAllowed', () => {
  it('answers 405 and names the allowed method', () => {
    const res = { status: jest.fn(), json: jest.fn(), setHeader: jest.fn() };
    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);

    methodNotAllowed(res as unknown as VercelResponse);

    expect(res.setHeader).toHaveBeenCalledWith('Allow', 'GET');
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });
});
