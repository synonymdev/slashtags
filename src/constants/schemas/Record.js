import { SLASHTAG_URI_SCHEMA } from './SlashtagURI';

/**
 * Schema for validating Slashtag Records.
  @const
  @type {import("json-schema").JSONSchema7} 
  @default
*/
export const RECORD_SCHEMA = {
  title: 'Slashtag Record',
  description: 'A Slashtag Record',
  type: 'object',
  required: ['data', 'metadata'],
  properties: {
    data: {
      type: [
        'string',
        'number',
        'null',
        'integer',
        'boolean',
        'array',
        'object',
      ],
    },
    metadata: {
      type: 'object',
      required: ['schema'],
      properties: {
        schema: SLASHTAG_URI_SCHEMA,
        tags: {
          type: 'array',
          items: { items: { type: 'string' } },
        },
      },
    },
  },
};
