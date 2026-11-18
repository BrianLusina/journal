/*
 * Shaped like a page of the 📰 Journal CMS data source as the Notion API returns it, taken from
 * the real "Navigating Decision-Making in Engineering" row. That row is still a draft without a
 * slug, so the fixture fills both in, as they are on any post the routes list.
 */
export const notionPage = (properties: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) => ({
  object: 'page',
  id: '7d3761f9-323d-4a15-a0e3-d000221fc5ac',
  created_time: '2024-02-06T10:12:00.000Z',
  cover: null,
  properties: {
    Title: {
      id: 'title',
      type: 'title',
      title: [
        {
          type: 'text',
          text: { content: 'Navigating Decision-Making in Engineering: A Framework-Centric Approach', link: null },
          annotations: { bold: true },
          plain_text: 'Navigating Decision-Making in Engineering: A Framework-Centric Approach',
          href: null,
        },
      ],
    },
    Slug: { type: 'rich_text', rich_text: [{ type: 'text', plain_text: 'navigating-decision-making' }] },
    Description: {
      type: 'rich_text',
      rich_text: [{ type: 'text', annotations: { bold: true }, plain_text: 'A Framework-Centric Approach' }],
    },
    Categories: {
      type: 'multi_select',
      multi_select: [{ id: 'V0tG', name: 'engineering strategy 101', color: 'brown' }],
    },
    Published: { type: 'date', date: { start: '2024-02-07T04:00:00.000+00:00', end: null, time_zone: null } },
    Status: { type: 'status', status: { id: 'pub', name: 'Published', color: 'green' } },
    Tags: {
      type: 'multi_select',
      multi_select: [
        { id: 'W19P', name: 'Decision', color: 'gray' },
        { id: 'W19Q', name: 'Framework', color: 'pink' },
      ],
    },
    // A text property whose value is a mention of a workspace member.
    Authors: {
      type: 'rich_text',
      rich_text: [
        {
          type: 'mention',
          mention: { type: 'user', user: { object: 'user', id: '9ed22509-8f08-4e1b-a58f-3215e7e5d2a7' } },
          plain_text: '@Brian Lusina',
        },
      ],
    },
    "Cover Image": {
      type: 'files',
      files: [
        {
          name: 'decision.png',
          type: 'file',
          file: { url: 'https://prod-files-secure.s3.us-west-2.amazonaws.com/decision.png', expiry_time: '2026-10-15T11:00:00.000Z' },
        },
      ],
    },
    canonical_url: { type: 'url', url: null },
    ...properties,
  },
  ...extra,
});
