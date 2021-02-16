import tableSchema from 'part:sanity-plugin-power-table/schema'

export const {table: simpleTable, schemas: simpleTableSchemas} = tableSchema({
  name: 'simpleTable',
  title: 'Simple table',
  cellSchema: {
    type: 'string',
  },
})

export const {table: blockTable, schemas: blockTableSchemas} = tableSchema({
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
    simpleTable,
    blockTable,
  ],
}
