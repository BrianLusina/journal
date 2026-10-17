jest.mock('@config', () => ({
  api: { contentfulCms: { restApiUrl: 'https://cdn', spaceId: 'space', environment: 'master', apiKey: 'token' } },
}));

const tagsResponse = (ok: boolean, items: { name: string; sys: { id: string } }[] = []) =>
  ({ ok, status: ok ? 200 : 503, json: async () => ({ items }) }) as Response;

// The tag list is cached for the module's lifetime, so each test loads a fresh copy.
const freshGetTagId = () => {
  let getTagId: (name: string) => Promise<string | undefined> = async () => undefined;
  jest.isolateModules(() => {
    ({ getTagId } = jest.requireActual('./contentful.tags'));
  });
  return getTagId;
};

describe('getTagId', () => {
  it('finds the ID of the Contentful tag with the name, fetching the tag list once', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      tagsResponse(true, [
        { name: 'Data Structures', sys: { id: 'datastructures' } },
        { name: 'System Design', sys: { id: 'systemDesign' } },
      ]),
    );
    const getTagId = freshGetTagId();

    await expect(getTagId('Data Structures')).resolves.toBe('datastructures');
    await expect(getTagId('Browsers')).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('https://cdn/spaces/space/environments/master/tags?limit=1000', {
      headers: { Authorization: 'Bearer token' },
    });
  });

  it('rejects when the tag list cannot be fetched, and fetches it again next time', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(tagsResponse(false))
      .mockResolvedValueOnce(tagsResponse(true, [{ name: 'Travel', sys: { id: 'travel' } }]));
    const getTagId = freshGetTagId();

    await expect(getTagId('Travel')).rejects.toThrow('Unable to fetch Contentful tags: 503');
    await expect(getTagId('Travel')).resolves.toBe('travel');
  });
});
