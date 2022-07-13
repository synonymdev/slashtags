declare module 'corestore' {
  import type Hypercore from 'hypercore';

  export = class Corestore {
    constructor(
      storage: any,
      opts?: {
        primaryKey?: Uint8Array;
      },
    );

    primaryKey: Uint8Array;

    replicate(socket: any, opts?: any);
    namespace(name?: string | Uint8Array): Corestore;
    close(): Promise<void>;

    createKeyPair(name: string);
    findingPeers(): () => void;

    get(opts: {
      name?: string;
      key?: Uint8Array;
      encryptionKey?: Uint8Array;
      keyPair?: {
        secretKey: Uint8Array;
        publicKey: Uint8Array;
      };
      cache?: boolean;
    }): Hypercore;
  };
}
