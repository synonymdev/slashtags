import EventEmitter from 'events';

export interface KeyPair {
  publicKey: Buffer;
  secretKey: Buffer;
}

export interface Session extends EventEmitter {
  publicKey: Buffer;
  getChallenge: () => Buffer;
  identifier: string;
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

export interface Noise {
  initialise: (prologue: Buffer, remoteStatic?: Buffer) => void;
  recv: (buf: Buffer) => Buffer;
  send: (payload: Buffer) => Uint8Array;
}
