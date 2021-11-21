import { schemas, schemasByTitle, addAction } from '../src/index.js'
import * as DocID from '@synonymdev/slashtags-docid'
import test from 'ava'

test('Add a new valid schema to actions', (t) => {
  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Some action',
    description:
      'Some action defined in protocol but is not provided in this package',
    type: 'object',
    properties: {
      foo: {
        type: 'string'
      },
      bar: {
        type: 'number'
      }
    },
    additionalProperties: false,
    required: ['challenge', 'cbURL']
  }

  const actionID = DocID.toString(DocID.CID.fromJSON(schema))

  const result = addAction(schema)

  t.deepEqual(result, actionID)
  t.deepEqual(schemas[actionID], schema)
  t.deepEqual(schemasByTitle[schema.title], schema)
})

test('Throw an error  for invalid schema', (t) => {
  const schema = {
    $schema: 'http://json-schema.org/draft-06/schema#',
    properties: {
      nested: {
        type: 'object',
        properties: {
          foo: { type: 'string' }
        }
      }
    }
  }

  const actionID = DocID.toString(DocID.CID.fromJSON(schema))

  t.throws(() => addAction(schema), {
    instanceOf: Error,
    message:
      'Invalid schema, errors: \n' +
      JSON.stringify(
        [
          {
            instancePath: '',
            schemaPath: '#/required',
            keyword: 'required',
            params: {
              missingProperty: 'additionalProperties'
            },
            message: "must have required property 'additionalProperties'"
          },
          {
            instancePath: '',
            schemaPath: '#/required',
            keyword: 'required',
            params: {
              missingProperty: 'title'
            },
            message: "must have required property 'title'"
          },
          {
            instancePath: '',
            schemaPath: '#/required',
            keyword: 'required',
            params: {
              missingProperty: 'description'
            },
            message: "must have required property 'description'"
          },
          {
            instancePath: '/$schema',
            schemaPath: '#/properties/%24schema/const',
            keyword: 'const',
            params: {
              allowedValue: 'http://json-schema.org/draft-07/schema#'
            },
            message: 'must be equal to constant'
          },
          {
            instancePath: '/properties/nested/type',
            schemaPath:
              '#/properties/properties/additionalProperties/properties/type/allOf/0/enum',
            keyword: 'enum',
            params: {
              allowedValues: [
                'array',
                'boolean',
                'integer',
                'null',
                'number',
                'string'
              ]
            },
            message: 'must be equal to one of the allowed values'
          }
        ],
        null,
        2
      )
  })

  t.deepEqual(schemas[actionID], undefined)
  t.deepEqual(schemasByTitle[schema.title], undefined)
})
