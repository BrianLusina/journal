import { Client } from '@notionhq/client';

export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export const databaseId = process.env.NOTION_DATABASE_ID;

export function getLimit(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return 100;

  return Math.min(Math.max(Math.floor(parsed), 1), 100);
}

export function isNotionConfigured(): boolean {
  return Boolean(databaseId && process.env.NOTION_API_KEY);
}
