declare module 'hypercore' {
  import type { EventEmitter } from 'events';
  export interface KeyPair {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
    auth: Auth;
  }

  interface Opts {
    key?: Uint8Array;
    keyPair?: KeyPair;
    encryptionKey?: Uint8Array;
    sparse?: boolean;
    cache?: boolean;
    onwait?: Hypercore['onwait'];
  }

  export interface Auth {
    sign?: (message: Uint8Array) => Uint8Array;
    verify: (message: Uint8Array, signature: Uint8Array) => boolean;
  }
  export = class Hypercore extends EventEmitter<'close'> {
    constructor(opts: Opts);

    length: number;
    writable: boolean;
    readable: boolean;
    /**
     * Buffer containing a key derived from the core's public key. In contrast to core.key this key does not allow you to verify the data but can be used to announce or look for peers that are sharing the same core, without leaking the core key.

Populated after ready has been emitted. Will be null before the event.
     */
    discoveryKey: Uint8Array;
    key: Uint8Array;
    keyPair: KeyPair;
    encryptionKey: Uint8Array;
    peers: Array<any>;
    byteLength: number;
    auth: Auth;
    closed: boolean;

    encryption: any;

    append(batch: any | any[]): Promise<number>;
    onwait: (seq: number, core: Hypercore) => any;

    ready(): Promise<void>;
    /**
     * Wait for the core to try and find a signed update to it's length. Does not download any data from peers except for a proof of the new core length.
     */
    update(): Promise<void>;
    session(opts: Opts): Hypercore;
    close(): Promise<void>;
    get(seq: nubmer): Promise<any>;
    findingPeers(): () => void;
    download(range?: { start: number; end: number }): {
      downloaded: () => Promise<void>;
    };

    on(event: 'ready', listener: () => any): this;
    once(event: 'ready', listener: () => any): this;
    removeListener(event: 'ready', listener: () => any): this;
    on(event: 'close', listener: () => any): this;
    once(event: 'close', listener: () => any): this;
    removeListener(event: 'close', listener: () => any): this;
    on(event: 'append', listener: () => any): this;
    once(event: 'append', listener: () => any): this;
    removeListener(event: 'append', listener: () => any): this;

    sessions: Hypercore[];
  };
}
