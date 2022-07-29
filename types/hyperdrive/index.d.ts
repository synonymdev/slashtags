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
