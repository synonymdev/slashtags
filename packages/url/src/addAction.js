import { metaschema, schemas, schemasByTitle } from './constants/index.js'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import * as DocID from '@synonymdev/slashtags-docid'

const ajv = new Ajv({ allErrors: true })
addFormats(ajv)

/**
 * Add an action's schema to use at formatting and paring action urls
 * @param {Schema} schema
 * @throws {Error} On invalid schema according to Slashtag's actions meta-schema
 * @returns {string} actionID string
 */
export const addAction = (schema) => {
  ajv.validate(metaschema, schema)

  if (ajv.errors) {
    throw new Error(
      'Invalid schema, errors: \n' + JSON.stringify(ajv.errors, null, 2)
    )
  }

  const actionID = DocID.toString(DocID.CID.fromJSON(schema))

  schemas[actionID] = schema
  schemasByTitle[schema.title] = schema
  return actionID
}

/** @typedef {import('ajv').SchemaObject} Schema */
