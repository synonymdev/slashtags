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
