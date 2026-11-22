import {defineField, defineType} from 'sanity'

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
        type: 'string',
    }),
    defineField({
        name: 'category',
        type: 'string',
    }),
    defineField({
        name: 'tags',
        type: 'array',
        of: [
        {
            type: 'reference', 
            to: [{type: 'tag'}]
        }
      ],
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'thumbnail',
      type: 'image',
    }),
    defineField({
      name: 'heroImage',
      type: 'image',
    }),
    defineField({
      name: 'body',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'authors',
      type: 'array',
      of: [
        {
            type: 'reference', 
            to: [{type: 'author'}]
        }
      ],
    }),
    defineField({
      name: 'featured',
      type: 'boolean',
    }),
  ],
})