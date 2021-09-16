export interface KeyPair {
  publicKey: Buffer;
  secretKey: Buffer;
}

/** Read more https://github.com/chm-diederichs/noise-handshake/blob/main/dh.js#L13 */
export interface Curve {
  DHLEN: number;
  PKLEN: number;
  SKLEN: number;
  ALG: string;
  generateKeyPair: (privKey?: Buffer) => KeyPair;
  dh: (pk: Buffer, lsk: Buffer) => Buffer;
}

export interface Session {
  challenge: Uint8Array;
  timer: NodeJS.Timeout;
  metadata: Uint8Array;
}

export type Serializable =
  | string
  | null
  | boolean
  | number
  | Serializable[]
  | { [key: string]: Serializable };
