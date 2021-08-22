export const IPFSUrlSchema = {
  type: 'string',
  pattern: '^ipfs://.+',
  maxLength: 150,
};

// Base64url from a sha256 hash
export const SlashtagKeyPattern = '^[A-Za-z0-9_-]{43}$';

export const SlashtagKeySchema = {
  type: 'string',
  pattern: SlashtagKeyPattern,
};
