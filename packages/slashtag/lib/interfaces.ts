import type _SecretStream from '@hyperswarm/secret-stream';
import type Corestore from 'corestore';
import type Protomux from 'protomux';

export interface RemoteSlashtag {
  publicKey: Uint8Array;
  /** z32 encoded public key */
  id: string;
  /** Slash URL slash://<id> */
  url: string;
}

export interface SecretStream extends _SecretStream {
  remoteSlashtag: RemoteSlashtag;
  protomux: Protomux;
}

export interface Emitter {
  on(event: 'ready', listener: (...args: any[]) => void): this;
  on(event: 'close', listener: (...args: any[]) => void): this;
  on(event: 'connection', listener: (connection: SecretStream) => void): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this;
}

export interface HypercoreLike {
  discoveryKey?: Uint8Array;
  findingPeers: Corestore['findingPeers'];
}
