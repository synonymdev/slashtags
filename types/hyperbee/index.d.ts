declare module 'hyperbee' {
  import type Hypercore from 'hypercore';
  import type { Readable } from 'stream';

  export = class Hyperbee {
    constructor(
      core: any,
      opts?: { metadata?: { contentFeed?: Uint8Array | null } },
    );
    sub(prefix: string): Hyperbee;

    put(key: any, value: any): Promise<void>;
    get(
      key: any,
      opts?: {
        update: boolean;
      },
    ): Promise<{ seq: number; key: any; value: any } | null>;
    del(key: any): Promise<any>;

    batch(): {
      put(key: any, value: any): Promise<void>;
      get(key: any): Promise<{ seq: number; key: any; value: any } | null>;
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
    getRoot(ensureHeader: boolean): Promise<any>;

    feed: Hypercore;
    sep: Uint8Array;
    metadata: {
      contentFeed?: Uint8Array | null;
    };
  };
}
