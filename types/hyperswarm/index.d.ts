declare module 'hyperswarm' {
  import EventEmitter from 'events';

  export interface KeyPair {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
  }

  class Server extends EventEmitter {}

  export = class hyperswarm extends EventEmitter {
    constructor(opts: any);
    server: Server;
    connections: Iterable;
    _allConnections: Map<Uint8Array, any>;
    peers: Map<string, any>;

    listen(): Promise<undefined>;
    destroy(): Promise<undefined>;
    joinPeer(key: Uint8Array): undefined;
    join(discoveryKey?: Uint8Array, options?: object);
    flush(): Promise<undefined>;
  };
}
