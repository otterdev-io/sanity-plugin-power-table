# sanity-plugin-power-table

Create powerful tables in sanity:
- Custom row and cell schema
- Cell-level management, each cell can have its own rowSpan and colSpan

based on [sanity-plugin-byo-table](https://www.npmjs.com/package/@ssfbank/sanity-plugin-byo-table)

## Installation

```
sanity install power-table
```

## Usage
* First import the schema generating function:
  ```js
  import tableSchema from 'part:sanity-plugin-power-table/schema'
  ```

* Next create and export schema for your table. 
  - Row Schema is optional. It should be an object if provided.
  - Cell schema can be a string or object.

  - Minimal example:
    ```js
    export const { table: myTable, schemas: myTableSchemas } = tableSchema({
      name: 'myTable',
      title: 'My table',
      cellSchema: {
        type: 'string',
      },
    })
    ```

  - Bigger example:
    ```js
    export const { table: myTable, schemas: myTableSchemas } = tableSchema({
      name: 'myTable',
      title: 'My table',
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
            of: [{ type: 'block' }] 
          },
        ],
      },
    })
    ```

- Use the table as a field in schema:
  ```js
  export default {
    name: 'mySchema',
    title: 'My Schema',
    type: 'document',
    fields: [
      {
        name: 'headline',
        title: 'Headline',
        type: 'array',
        of: [{ type: 'block' }],
      },
      myTable,
    ],
  }
  ```

- Import the table schemas in your schema.js:

  ```js
  import createSchema from 'part:@sanity/base/schema-creator'
  import mySchema, {myTableSchemas} from './mySchema'

  export default createSchema({
    name: 'default',
    types: [
      mySchema,
      ...myTableSchemas
    ],
  });
  ```

## License

MIT © Christopher Fraser
See LICENSE