import { APIErrorCode, Client, isFullDatabase, isNotionClientError } from '@notionhq/client';

export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const dataSourceIdFromEnv = process.env.NOTION_DATA_SOURCE_ID;
const databaseId = process.env.NOTION_DATABASE_ID;

let resolvedDataSourceId: Promise<string> | undefined;

async function resolveDataSourceId(id: string): Promise<string> {
  try {
    const database = await notion.databases.retrieve({ database_id: id });
    const dataSource = isFullDatabase(database) ? database.data_sources[0] : undefined;
    if (!dataSource) {
      throw new Error(`Notion database ${id} has no data sources`);
    }
    return dataSource.id;
  } catch (error) {
    // NOTION_DATABASE_ID used to be passed straight to dataSources.query, so an existing
    // deployment may hold a data source ID under that name. Keep it working.
    if (isNotionClientError(error) && error.code === APIErrorCode.ObjectNotFound) {
      return id;
    }
    throw error;
  }
}

/**
 * The data source the posts live in. Since Notion API 2025-09-03, queries target a data source,
 * whose ID differs from its database's ID. NOTION_DATA_SOURCE_ID is used as is; otherwise the
 * first data source of NOTION_DATABASE_ID is looked up once per function instance.
 */
export function getDataSourceId(): Promise<string> {
  if (dataSourceIdFromEnv) {
    return Promise.resolve(dataSourceIdFromEnv);
  }
  if (!resolvedDataSourceId) {
    resolvedDataSourceId = resolveDataSourceId(databaseId!).catch(error => {
      // Do not cache a failure; the next request retries.
      resolvedDataSourceId = undefined;
      throw error;
    });
  }
  return resolvedDataSourceId;
}

export function getLimit(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return 100;

  return Math.min(Math.max(Math.floor(parsed), 1), 100);
}

export function isNotionConfigured(): boolean {
  return Boolean((dataSourceIdFromEnv || databaseId) && process.env.NOTION_API_KEY);
}
