import tableSchema from 'part:power-table/schema'

export const simpleTableSchemas = tableSchema({
  name: 'simpleTable',
  title: 'Simple table',
  cellSchema: {
    type: 'string',
  },
})

export const blockTableSchemas = tableSchema({
  name: 'blockTable',
  title: 'Block Table',
  rowSchema: {
    type: 'object',
    fields: [
      {
        name: 'heading',
        title: 'Heading',
        type: 'boolean',
      },
    ],
  },
  cellSchema: {
    type: 'object',
    fields: [
      {
        name: 'contents',
        title: 'Contents',
        type: 'array',
        of: [{type: 'block'}],
      },
    ],
  },
})

export default {
  name: 'myDoc',
  title: 'My Document',
  type: 'document',
  fields: [
    {
      name: 'headline',
      title: 'Headline',
      type: 'array',
      of: [{type: 'block'}],
    },
    {
      name: 'demoSimpleTable',
      title: 'Simple Table',
      type: 'simpleTable',
    },
    {
      name: 'demoBlockTable',
      title: 'Block Table',
      type: 'blockTable',
    },
  ],
}
