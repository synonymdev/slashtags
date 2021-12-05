export type { KeyPair } from 'noise-curve-tiny-secp';

export * as varint from 'varint';

export type JSONElement = string | null | boolean | number;
export type JSON = JSONElement | JSONElement[] | { [key: string]: JSONElement };
