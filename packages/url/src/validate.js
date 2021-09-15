import addFormats from 'ajv-formats'
import { schemas } from './constants/index.js'
import Ajv from 'ajv'

const ajv = new Ajv({ allErrors: true, removeAdditional: true })
addFormats(ajv)

/**
 * Validate and remove additinal fields from data
 * @param {string} actionID Action schema DocumentID
 * @param {object} data
 * @param {boolean} [throwInvalid=false] Throw validation errors
 * @returns {object}
 */
export const validate = (actionID, data, throwInvalid = false) => {
  const schema = schemas[actionID]

  if (!schema) throw new Error('Unknown slashtags action: ' + actionID)

  ajv.validate(schema, data)

  if (throwInvalid && ajv.errors) {
    throw new Error(
      'Invalid payload for schema: ' +
        schema.title +
        '\n' +
        JSON.stringify(ajv.errors, null, 2)
    )
  }

  return data
}

/** @typedef {import('@synonymdev/slashtags-docid').CID.DocID} DocID */
