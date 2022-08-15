// file://./node_modules/@hyperswarm/testnet/index.js
declare module '@hyperswarm/testnet' {
  export default function createTestnet(
    nodes: number,
    teardown: Function,
  ): { bootstrap: Array<{ host: string; port: number }> };
}

// file://./node_modules/hyperswarm/index.js
declare module 'hyperswarm' {
  import EventEmitter from 'events';

  export interface KeyPair {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
  }

  class Server extends EventEmitter {
    listen: (keyPair: KeyPair) => Promise<void>;
  }

  interface Discovery {
    flushed(): Promise<void>;
  }
  export = class hyperswarm extends EventEmitter {
    constructor(opts: any);
    server: Server;
    connections: Iterable;
    _allConnections: Map<Uint8Array, any>;
    peers: Map<string, any>;
    keyPair: KeyPair;

    listen(): Promise<undefined>;
    destroy(): Promise<undefined>;
    joinPeer(key: Uint8Array): undefined;
    join(
      discoveryKey?: Uint8Array,
      options?: { server: boolean; client: boolean },
    ): Discovery;
    flush(): Promise<undefined>;
  };
}

// file://./node_modules/b4a/index.js
declare module 'b4a' {
  function toString(
    buf: Buffer | Uint8Array,
    encoding?: 'hex' | 'base64' | 'utf8' | 'utf16le' | 'ascii',
  ): string;
  function isBuffer(value: any): boolean;
  function alloc(n: number): Buffer;
  function allocUnsafe(n: number): Buffer;
  function from(
    input: string | Uint8Array | number[],
    encoding?: 'hex' | 'base64' | 'utf8' | 'utf16le' | 'ascii',
  ): Buffer;
  function byteLength(
    input: string | Buffer,
    encoding?: 'hex' | 'base64' | 'utf8' | 'utf16le' | 'ascii',
  ): number;
  function concat(args: Array<Uint8Array>): Uint8Array;
  function equals(buf: Uint8Array, buf2: Uint8Array): boolean;
}

// file://./node_modules/corestore/index.js
declare module 'corestore' {
  import type Hypercore from 'hypercore';
  import type { Encoding } from 'compact-encoding';

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
      onwait?: Hypercore['onwait'];
      keyEncoding?: string | Encoding;
      _preready?: (core: Hypercore) => any;
    }): Hypercore;
  };
}

// file://./node_modules/z32/index.js
declare module 'z32' {
  function encode(buf: Uint8Array): string;
  function decode(string: string): Uint8Array;

  export = {
    encode,
    decode,
  };
}

// file://./node_modules/b4a/index.js
declare module 'b4a' {
  function toString(
    buf: Buffer | Uint8Array,
    encoding?: 'hex' | 'base64' | 'utf8' | 'utf16le' | 'ascii',
  ): string;
  function isBuffer(value: any): boolean;
  function alloc(n: number): Buffer;
  function allocUnsafe(n: number): Buffer;
  function from(
    input: string | Uint8Array | number[],
    encoding?: 'hex' | 'base64' | 'utf8' | 'utf16le' | 'ascii',
  ): Buffer;
  function byteLength(
    input: string | Buffer,
    encoding?: 'hex' | 'base64' | 'utf8' | 'utf16le' | 'ascii',
  ): number;
  function concat(args: Array<Uint8Array>): Uint8Array;
  function equals(buf: Uint8Array, buf2: Uint8Array): boolean;
}

// file://./node_modules/sodium-universal/index.js
declare module 'sodium-universal' {
  import * as sodium from 'sodium-native';
  export = sodium;
}

// file://./node_modules/safety-catch/index.js
declare module 'safety-catch' {
  function safety(error: any): any;
  export = safety;
}

// file://./node_modules/random-access-memory/index.js
declare module 'random-access-memory' {
  function foo(): any;
  export = foo;
}

// file://./node_modules/random-access-web/index.js
declare module 'random-access-web' {
  function foo(): any;
  export = foo;
}

// file://./node_modules/hyperdrive/index.js
declare module 'hyperdrive' {
  import type Hypercore from 'hypercore';
  import type Hyperbee from 'hyperbee';
  import type Corestore from 'corestore';
  import type EventEmitter from 'events';
  import type Hyperblobs from 'hyperblobs';

  export = class HyperDrive extends EventEmitter {
    constructor(
      store: Corestore,
      options?: {
        _db?: Hyperbee;
        _files?: Hyperbee;
        onwait?: (seq: number, core: Hypercore) => any;
      },
    );
    constructor(
      store: Corestore,
      key: Uint8Array,
      options?: {
        _db?: Hyperbee;
        _files?: Hyperbee;
        onwait?: (seq: number, core: Hypercore) => any;
      },
    );

    blobs?: Hyperblobs;
    db: Hyperbee;
    files: Hyperbee;
    /**
     * Instance of [Corestore](https://github.com/hypercore-protocol/corestore-next/blob/master/index.js)
     */
    corestore: Corestore;
    /**
     * Promise that resolves once the drive is fully open and emits 'ready'.
     */
    opening: Promise<void>;
    /**
     * Boolean set to true once 'ready' is emitted.
     */
    opened: boolean;

    /**
     * The public key of the Hypercore backing the drive.
     */
    key: Uint8Array;
    /**
     * The hash of the public key of the Hypercore backing the drive, can be used to seed the drive using Hyperswarm.
     */
    discoveryKey: Hypercore['discoveryKey'];
    /**
     * The public key of the Hyperblobs instance holding blobs associated with entries in the drive.
     */
    contentKey: Uint8Array;
    /**
     * The underlying Hypercore backing the drive.
     */
    core: Hypercore;
    /**
     * The version (offset in the underlying Hypercore) of the drive.
     */
    version: number;

    /**
     * Create a hook that tells Hypercore you are finding peers for this core in the background. Call done when your current discovery iteration is done. If you're using Hyperswarm, you'd normally call this after a swarm.flush() finishes.

This allows drive.update to wait for either the findingPeers hook to finish or one peer to appear before deciding whether it should wait for a merkle tree update before returning.
     */
    findingPeers(): Hypercore['findingPeers'];
    /**
     * Wait for the drive's core to try and find a signed update to it's length. Does not download any data from peers except for a proof of the new core length.
     */
    update(): Hypercore['update'];
    /**
     * Wait for the drive to fully open. In general, you do NOT need to wait for ready unless checking a synchronous property on drive since internals await this themselves.
     */
    ready(): Promise<void>;
    /**
     * Checks out a read-only snapshot of a Hyperdrive at a particular version.
     */
    checkout(len: number): HyperDrive;
    /**
     * Atomically mutate the drive, has the same interface as Hyperdrive.
     */
    batch(): HyperDrive;
    /**
     * Atomically commit a batch of mutations to the underlying drive.
     */
    flush(): Promise<void>;
    /**
     * Close the drive and its underlying Hypercore backed datastructures.
     */
    close(): Promise<void>;
    /**
     * Returns the hyperblobs instance storing the blobs indexed by drive entries.
     */
    getBlobs(): Promise<Hyperblobs>;
    /**
     * Returns the blob at path in the drive. Internally, Hyperdrive contains a metadata index of entries that "point" to offsets in a Hyperblobs instance. Blobs themselves are accessible via drive.get(path), whereas entries are accessible via drive.entry(path). If no blob exists at path, returns null.
     */
    get(path: string): Promise<Uint8Array>;
    /**
     * Sets the blob in the drive at path.
     */
    put(
      path: string,
      buf: Uint8Array,
      opts? = { executable: boolean, metadata: any },
    ): ReturnType<Hyperbee['put']>;
    /**
     * Removes the entry at path from the drive. If a blob corresponding to the entry at path exists, it is not currently deleted.
     */
    del(path: string): ReturnType<Hyperbee['del']>;
    /**
     *Creates an entry in drive at path that points to the entry at linkname. Note, if a blob entry currently exists at path then drive.symlink(path, linkname) will overwrite the entry and drive.get(path) will return null, while drive.entry(path) will return the entry with symlink information.
     */
    symlink(path: string, dst: string, opts?: { metadata: any });
    /**
     *
     * Returns the entry at path in the drive. An entry holds metadata about a path.
     */
    entry(path: string): ReturnType<Hyperbee['get']> | Promise<void>;

    _onwait: Hypercore['onwait'];
    _openBlobsFromHeader(opts?: { wait: boolean }): Promise<Hyperblobs>;

    on(event: 'close', listener: () => any): this;
    on(event: 'blobs', listener: (blobs: Hyperblobs) => any): this;
    once(event: 'ready', listener: () => any): this;
    once(event: 'close', listener: () => any): this;
    once(event: 'blobs', listener: (blobs: Hyperblobs) => any): this;
    removeListener(event: 'ready', listener: () => any): this;
    removeListener(event: 'close', listener: () => any): this;
    removeListener(event: 'blobs', listener: (blobs: Hyperblobs) => any): this;
  };
}

// file://./node_modules/hypercore/index.js
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

// file://./node_modules/hyperblobs/index.js
declare module 'hyperblobs' {
  import type Hypercore from 'hypercore';

  export interface index {
    byteOffset: number;
    blockOffset: number;
    blockLength: number;
    byteLength: number;
  }
  export = class Hyperblobs {
    constructor(core: Hypercore);

    core: Hypercore;

    put(blob: Uint8Array): Promise<index>;
    get(index: index): Promise<Uint8Array | null>;
  };
}

// file://./node_modules/hyperbee/index.js
declare module 'hyperbee' {
  import type Hypercore from 'hypercore';
  import type { Readable } from 'stream';
  import { Encoding } from 'compact-encoding';

  export interface Node extends Block {
    key: string;
    seq: number;
    value: Uint8Array;
  }
  export = class Hyperbee {
    constructor(
      core: any,
      opts?: {
        keyEncoding?: string | Encoding;
        valueEncoding?: string | Encoding;
        metadata?: {
          contentFeed?: Uint8Array | null;
        };
      },
    );
    sub(prefix: string): Hyperbee;

    put(key: any, value: any): Promise<void>;
    get(
      key: any,
      opts?: {
        update: boolean;
      },
    ): Promise<Node | null>;
    del(key: any): Promise<any>;

    batch(): {
      put(key: any, value: any): Promise<void>;
      get(key: any): Promise<Node | null>;
      flush(): Promise<>;
    };

    createReadStream(options: any): Readable;
    createHistoryStream(options: any): Readable;

    getBlock(
      seq: number,
      opts: any,
    ): Promise<{
      key: Uint8Array;
      isDeletion(): boolean;
    }>;

    ready(): Promise<void>;

    getHeader(opts?: any): Promise<{ metadata?: { contentFeed?: Uint8Array } }>;
    getRoot(ensureHeader?: boolean): Promise<any>;

    version: number;
    feed: Hypercore;
    sep: Uint8Array;
    metadata: {
      contentFeed?: Uint8Array | null;
    };
  };
}

// file://./node_modules/graceful-goodbye/index.js
declare module 'graceful-goodbye' {
  export = function (cb: (...args: any[]) => {}) {};
}

// file://./node_modules/compact-encoding/index.js
declare module 'compact-encoding' {
  function from(opts: object): object;
  function decode(enc: Encoding, val: Uint8Array): any;
  function encode(enc: Encoding, val: any);

  let uint: Encoding;
  let fixed32: Encoding;
  let string: Encoding;
  let raw: Encoding;

  interface Encoding {
    preencode(
      state: { start: number; end: number; buffer: Uint8Array },
      val: any,
    ): void;
    encode(
      state: { start: number; end: number; buffer: Uint8Array },
      val: any,
    ): void;
    decode(buffer): any;
  }
}
