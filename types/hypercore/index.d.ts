declare module 'hypercore' {
  import type { EventEmitter } from 'hyperswarm';
  export interface KeyPair {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
    auth: Auth;
  }

  export interface Auth {
    sign: (message: Uint8Array) => Uint8Array;
    verify: (message: Uint8Array, signature: Uint8Array) => boolean;
  }
  export = class Hypercore extends EventEmitter {
    constructor(opts: any);

    length: number;
    writable: boolean;
    readable: boolean;
    discoveryKey: Uint8Array;
    key: Uint8Array;
    keyPair: { foo: number };
    encryptionKey: Uint8Array;
    peers: Array<any>;

    ready(): Promise<void>;
    update(): Promise<void>;
    session(opts: any): Hypercore;
    close(): Promise<void>;
    get(seq: nubmer): Promise<any>;
    findingPeers(): () => void;
  };
}
