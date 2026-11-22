import {defineField, defineType} from 'sanity'

// The fields mirror UnifiedPost (packages/cms/src/types.ts). packages/cms reads them through
// schema.json; run `bun run schema:extract` after any change here (see "Sanity schema" in
// docs/ARCHITECTURE.md).
const altField = defineField({
  name: 'alt',
  title: 'Alternative text',
  type: 'string',
})

export const blogPostType = defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subtitle',
      type: 'string',
    }),
    defineField({
      name: 'description',
      type: 'text',
    }),
    defineField({
      name: 'category',
      type: 'string',
    }),
    defineField({
      name: 'tags',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'tag'}]}],
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publishDate',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'thumbnail',
      type: 'image',
      fields: [altField],
    }),
    defineField({
      name: 'heroImage',
      type: 'image',
      fields: [altField],
    }),
    defineField({
      name: 'body',
      type: 'array',
      of: [{type: 'block'}, {type: 'image', fields: [altField]}, {type: 'code'}],
    }),
    defineField({
      name: 'authors',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'author'}]}],
    }),
    defineField({
      name: 'featured',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})
