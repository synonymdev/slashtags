export * as varint from 'varint';

export type JSONElement = string | number | boolean | object | null;
export type JSON = JSONElement | JSONElement[] | Record<string, JSONElement>;

export type KeyPair = {
  publicKey: Buffer;
  secretKey: Buffer;
};
