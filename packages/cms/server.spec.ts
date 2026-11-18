const ORIGINAL_ENV = process.env;

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

// apps/sites imports this entry on every page, so it must load on a deployment without a CMS.
it('loads with no CMS configured, and reports both sources unconfigured', async () => {
  process.env = { ...ORIGINAL_ENV };
  for (const name of ['NOTION_API_KEY', 'NOTION_DATA_SOURCE_ID', 'NOTION_DATABASE_ID', 'CONTENTFUL_CMS_API_KEY', 'CONTENTFUL_CMS_SPACE_ID']) {
    delete process.env[name];
  }
  vi.resetModules();

  const server = await import('./server');

  expect(server.isNotionConfigured()).toBe(false);
  expect(server.isContentfulConfigured()).toBe(false);
  expect(server.notionSource.source).toBe('notion');
});
