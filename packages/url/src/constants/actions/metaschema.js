export const metaschema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Slashtags actions meta-schema',
  definitions: {
    nonNegativeInteger: {
      type: 'integer',
      minimum: 0
    },
    nonNegativeIntegerDefault0: {
      allOf: [{ $ref: '#/definitions/nonNegativeInteger' }, { default: 0 }]
    },
    stringArray: {
      type: 'array',
      items: { type: 'string' },
      uniqueItems: true,
      default: []
    }
  },
  type: ['object'],
  required: ['additionalProperties', 'title', 'description'],
  properties: {
    $schema: {
      type: 'string',
      const: 'http://json-schema.org/draft-07/schema#'
    },
    $comment: {
      type: 'string'
    },
    title: {
      type: 'string'
    },
    description: {
      type: 'string'
    },
    default: true,
    readOnly: {
      type: 'boolean',
      default: false
    },
    writeOnly: {
      type: 'boolean',
      default: false
    },
    examples: {
      type: 'array',
      items: true
    },
    multipleOf: {
      type: 'number',
      exclusiveMinimum: 0
    },
    maximum: {
      type: 'number'
    },
    exclusiveMaximum: {
      type: 'number'
    },
    minimum: {
      type: 'number'
    },
    exclusiveMinimum: {
      type: 'number'
    },
    maxLength: { $ref: '#/definitions/nonNegativeInteger' },
    minLength: { $ref: '#/definitions/nonNegativeIntegerDefault0' },
    pattern: {
      type: 'string',
      format: 'regex'
    },
    contains: { $ref: '#' },
    maxProperties: { $ref: '#/definitions/nonNegativeInteger' },
    minProperties: { $ref: '#/definitions/nonNegativeIntegerDefault0' },
    required: { $ref: '#/definitions/stringArray' },
    additionalProperties: { type: 'boolean', const: false },
    properties: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          type: {
            allOf: [
              {
                enum: [
                  'array',
                  'boolean',
                  'integer',
                  'null',
                  'number',
                  'string'
                ]
              }
            ]
          }
        }
      },
      default: {}
    },
    const: true,
    enum: {
      type: 'array',
      items: true,
      minItems: 1,
      uniqueItems: true
    },
    type: { const: 'object' },
    format: { type: 'string' },
    contentMediaType: { type: 'string' },
    contentEncoding: { type: 'string' }
  }
}
