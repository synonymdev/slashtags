import * as DocID from '@synonymdev/slashtags-docid'

/** @type {Schema[]} */
export const schemasList = [
  {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Slashtag Auth Action',
    description: "Action's Payload for SlashtagAuth enabled wallets",
    type: 'object',
    properties: {
      challenge: {
        type: 'string'
      },
      cbURL: {
        type: 'string',
        format: 'uri'
      }
    },
    additionalProperties: false,
    required: ['challenge', 'cbURL']
  }
]

export const schemas = Object.fromEntries(
  schemasList.map((schema) => [
    DocID.toString(DocID.CID.fromJSON(schema)),
    schema
  ])
)

export const schemasByTitle = Object.fromEntries(
  schemasList.map((schema) => [schema.title, schema])
)

/** @typedef {import('ajv').SchemaObject} Schema */
