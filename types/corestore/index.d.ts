declare module 'corestore' {
  import type Hypercore from 'hypercore';

  export = class Corestore {
    constructor(
      storage: any,
      opts?: {
        primaryKey?: Uint8Array;
      },
    );

    replicate(socket: any);
    namespace(name: string | Uint8Array): Corestore;
    close(): Promise<void>;

    createKeyPair(name: string);
    findingPeers(): () => void;
  };
}
