import createSchema from 'part:@sanity/base/schema-creator'
import myDoc, {simpleTableSchemas, blockTableSchemas} from './myDoc'

export default createSchema({
  name: 'default',
  types: [myDoc, ...simpleTableSchemas, ...blockTableSchemas],
})
