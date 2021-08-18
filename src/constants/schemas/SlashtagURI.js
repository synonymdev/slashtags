/**
 * Slashtag URI scheme.
  @const
  @type {import("json-schema").JSONSchema7} 
  @default
*/
export const SLASHTAG_URI_SCHEMA = {
  title: 'Slashtag URI',
  description: 'A Slashtag URI shceme.',
  type: 'string',
  pattern: '^slashtag:[a-zA-Z0-9_-]*$',
};
