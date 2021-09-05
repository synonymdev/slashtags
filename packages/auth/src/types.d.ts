import { EventEmitter } from 'events';

export type KeyPair = {
  publicKey: Buffer;
  secretKey: Buffer;
};

/** Read moer https://github.com/chm-diederichs/noise-handshake/blob/main/dh.js#L13 */
export type Curve = {
  DHLEN: number;
  PKLEN: number;
  SKLEN: number;
  ALG: string;
  generateKeyPair: (privKey: Buffer) => KeyPair;
  dh: (pk: Buffer, lsk: Buffer) => Buffer;
};

export interface Session extends EventEmitter {
  publicKey: Buffer;
  getChallenge: () => Buffer;
  identifier: string;
}
