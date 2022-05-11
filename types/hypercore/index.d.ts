declare module 'hypercore' {
  export interface KeyPair {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
    auth: Auth;
  }

  export interface Auth {
    sign: (message: Uint8Array) => Uint8Array;
    verify: (message: Uint8Array, signature: Uint8Array) => boolean;
  }

  export = class Hypercore {
    constructor(opts: any);

    length: number;
    writable: boolean;
    readable: boolean;
    discoveryKey: Uint8Array;
    key: Uint8Array;
    keyPair: { foo: number };
    encryptionKey: Uint8Array;

    ready(): Promise<void>;
    update(): Promise<void>;
    get(seq: nubmer): Promise<any>;
    findingPeers(): () => void;
  };
}
