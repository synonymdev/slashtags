import { SlashtagKeyPattern, SlashtagKeySchema } from './primitives.js';

/**
 * Equivilant of ceramic idx, this is a convinent index of user's public data.
 */
export const Account = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'BasicProfile',
  description:
    'A mappings of schemaIDs to recordIDs that point to public, schema conforming, and self asserted records',
  type: 'object',
  propertyNames: {
    pattern: SlashtagKeyPattern,
  },
  patternProperties: {
    [SlashtagKeyPattern]: SlashtagKeySchema,
  },
  additionalProperties: false,
};
