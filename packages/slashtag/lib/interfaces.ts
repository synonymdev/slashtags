import type _SecretStream from '@hyperswarm/secret-stream';

export interface RemoteSlashtag {
  publicKey: Uint8Array;
  /** z32 encoded public key */
  id: string;
  /** Slash URL slash://<id> */
  url: string;
}

export interface SecretStream extends _SecretStream {
  remoteSlashtag: RemoteSlashtag;
}

export interface SwarmOpts {
  bootstrap?: Array<{ host: string; port: number }>;
}

export interface Emitter {
  on(event: 'ready', listener: (...args: any[]) => void): this;
  on(event: 'close', listener: (...args: any[]) => void): this;
  on(event: 'connection', listener: (connection: SecretStream) => void): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this;
}

export interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  auth: Auth;
}

export interface Auth {
  sign: (message: Uint8Array) => Uint8Array;
  verify: (message: Uint8Array, signature: Uint8Array) => boolean;
}
