/**
 * The most minimal Record with required properties.
  @const
  @prop {String} schema  - Schema of the record's content.
  @prop {object} content - Main content of the record.
  @prop {object} tags    - Tags for indexing filtering and searching.
  @type {SlashtagRecord} 
  @default
*/
export const BASIC_RECORD = {
  data: {},
  metadata: {
    schema: 'blank',
  },
};
