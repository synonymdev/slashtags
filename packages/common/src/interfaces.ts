export * as varint from 'varint'

export type JSONElement = string | number | boolean | object | null
export type JSON = JSONElement | JSONElement[] | Record<string, JSONElement>

export interface KeyPair {
  publicKey: Buffer
  secretKey: Buffer
}

export interface JsonLdObject {
  '@context': string
  '@id': string
  '@type': string
  [key: string]: JsonLdPrimitive | JsonLdPrimitive[]
}

export type JsonLdPrimitive = string | number | boolean | JsonLd | JSON

export type JsonLd = JsonLdObject | JsonLdObject[]
