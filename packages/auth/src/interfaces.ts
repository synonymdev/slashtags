export interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

/** Read more https://github.com/chm-diederichs/noise-handshake/blob/main/dh.js#L13 */
export interface Curve {
  DHLEN: number;
  PKLEN: number;
  SKLEN: number;
  ALG: string;
  generateKeyPair: (privKey?: Uint8Array) => KeyPair;
  dh: (pk: Uint8Array, lsk: Uint8Array) => Uint8Array;
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
