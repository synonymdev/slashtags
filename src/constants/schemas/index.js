import { JSONSchema7 } from 'json-schema';
import { BLANK_SCHEMA } from './Blank';
import { RECORD_SCHEMA } from './Record';

/**
 * @type {{[key:string] : JSONSchema7}}
 */
export const DEFAULT_SCHEMAS = {
  record: RECORD_SCHEMA,
  blank: BLANK_SCHEMA,
};
