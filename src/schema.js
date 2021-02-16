import TableInput from './table-input'

export default function tableSchema({name, rowSchema, cellSchema}) {
  const table = {
    title: 'Table',
    name: name,
    type: 'object',
    inputComponent: TableInput,
    fields: [
      {
        name: 'rows',
        title: 'Rows',
        type: 'array',
        of: [{type: `${name}.row`}],
      },
    ],
  }

  const row = {
    title: 'Row',
    name: `${name}.row`,
    type: 'object',
    fields: [
      {
        title: 'Cells',
        name: 'cells',
        type: 'array',
        of: [{type: `${name}.cell`}],
      },
    ],
  }

  const cell = {
    title: 'Cell',
    name: `${name}.cell`,
    type: 'object',
    fields: [
      {
        name: 'rowSpan',
        title: 'Row Span',
        type: 'number',
      },
      {
        name: 'colSpan',
        title: 'Column Span',
        type: 'number',
      },
      {name: 'data', title: 'Cell Data', type: `${name}.cell.data`},
    ],
  }

  const cellData = {
    title: 'Cell Data',
    name: `${name}.cell.data`,
    ...cellSchema,
  }

  const schemas = [table, row, cell, cellData]

  if (rowSchema) {
    row.fields.push({
      title: 'Row Data',
      name: 'data',
      type: `${name}.row.data`,
    })

    const rowData = {
      title: 'Row Data',
      name: `${name}.row.data`,
      ...rowSchema,
    }

    schemas.push(rowData)
  }

  return schemas
}
