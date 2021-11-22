import { metaschema, schemasByTitle } from './constants/index.js';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

/**
 * Add an action's schema to use at formatting and paring action urls
 * @param {*} schema
 * @throws {Error} On invalid schema according to Slashtag's actions meta-schema
 * @returns {*} actionID string
 */
export const addAction = (schema) => {
  ajv.validate(metaschema, schema);

  if (ajv.errors) {
    throw new Error(
      'Invalid schema, errors: \n' + JSON.stringify(ajv.errors, null, 2),
    );
  }

  schemasByTitle[schema.title] = schema;
  return;
};
