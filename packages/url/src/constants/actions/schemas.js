/** @type {Schema[]} */
export const schemasList = [
  {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Slashtag Accounts Payload',
    description: "Action's Payload for Slashtag accounts enabled wallets",
    type: 'object',
    properties: {
      title: {
        type: 'string',
      },
      image: {
        type: 'string',
        format: 'uri',
      },
      pubKey: {
        type: 'string',
        contentEncoding: 'base16',
      },
      challenge: {
        type: 'string',
        contentEncoding: 'base16',
      },
      cbURL: {
        type: 'string',
        format: 'uri',
      },
    },
    additionalProperties: false,
    required: ['title', 'image', 'pubKey', 'challenge', 'cbURL'],
  },
];

export const schemas = Object.fromEntries(
  schemasList.map((schema) => [schema]),
);

export const schemasByTitle = Object.fromEntries(
  schemasList.map((schema) => [schema.title, schema]),
);

/** @typedef {import('ajv').SchemaObject} Schema */
