import { eventParams } from './events';

describe('eventParams', () => {
  it('keeps only the origin and path of an outbound link, never its query or fragment', () => {
    expect(eventParams({ name: 'outbound_click', target: 'github', url: 'https://github.com/BrianLusina/journal?tab=x&token=secret#readme' })).toEqual({
      target: 'github',
      url: 'https://github.com/BrianLusina/journal',
    });
  });

  it('drops an outbound URL that is not a URL', () => {
    expect(eventParams({ name: 'outbound_click', target: 'project', url: 'not a url' })).toEqual({ target: 'project' });
  });

  it.each([
    [{ name: 'resume_download' } as const, {}],
    [{ name: 'contact_submit', outcome: 'failure' } as const, { outcome: 'failure' }],
    [{ name: 'project_filter', filter: 'stack', value: 'TypeScript' } as const, { filter: 'stack', value: 'TypeScript' }],
  ])('passes the parameters of %o', (event, params) => {
    expect(eventParams(event)).toEqual(params);
  });
});
