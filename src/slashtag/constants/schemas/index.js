import * as primitives from './primitives.js';

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
    pattern: primitives.SlashtagKeyPattern,
  },
  patternProperties: {
    [primitives.SlashtagKeyPattern]: primitives.SlashtagKeySchema,
  },
  additionalProperties: false,
};

export const Tags = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Tags',
  description: 'Add arbitrary tags to any record',
  type: 'object',
  properties: {
    uri: { type: 'string', format: 'uri' },
    tags: { type: 'array', items: { type: 'string' } },
  },
  additionalProperties: false,
  required: ['uri', 'tags'],
};

export const Rating = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Rating',
  description: 'Rate a record',
  type: 'object',
  properties: {
    uri: { type: 'string', format: 'uri' },
    rating: {
      type: 'number',
      minimum: 0,
      maximum: 100,
    },
  },
  additionalProperties: false,
  required: ['uri', 'rating'],
};

export const Connection = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Connection',
  description: 'Add or remove a trusted connection',
  type: 'object',
  properties: {
    uri: { type: 'string', format: 'uri' },
    trust: {
      type: 'number',
      minimum: 0,
      maximum: 100,
    },
  },
  additionalProperties: false,
  required: ['uri', 'trust'],
};

export const ACL = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'ACL',
  description: 'Permissions for a connection on a whole or a part of a record',
  type: 'object',
  properties: {
    connection: { type: 'string', format: 'uri' },
    record: { type: 'string', format: 'uri' },
    permissions: {
      type: 'object',
      properties: {
        read: { type: 'boolean' },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
  required: ['connection', 'record', 'permissions'],
};

export const Resource = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Resource',
  description: 'A thin wrapper around a non slashtag uri',
  type: 'object',
  properties: {
    uri: { type: 'string', format: 'uri' },
    dataHash: { type: 'string' },
  },
  additionalProperties: false,
  required: ['uri'],
};

export const AuthChallenge = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Slashtag auth challenge',
  description: 'Configuration for SlashtagAuth enabled wallets',
  type: 'object',
  properties: {
    challenge: { type: 'string', pattern: '^[0-9a-fA-F]{64}$' },
    pubKey: { type: 'string', pattern: '^[0-9a-fA-F]{64}$' },
    answerURI: { type: 'string', format: 'uri' },
  },
  additionalProperties: false,
  required: ['challenge', 'pubKey', 'answerURI'],
};
