import {defineField, defineType} from 'sanity'

export const authorType = defineType({
    name: 'author',
    title: 'Author',
    type: 'document',
    fields: [
        defineField({
            name: 'name',
            type: 'string',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'avatarUrl',
            type: 'url',
        }),
        defineField({
            name: 'shortBio',
            type: 'text',
        }),
    ],
})