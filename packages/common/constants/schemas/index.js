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
