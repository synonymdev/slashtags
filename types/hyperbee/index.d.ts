declare module 'hyperbee' {
  import type Hypercore from 'hypercore';
  import type { Readable } from 'stream';

  export = class Hyperbee {
    constructor(core: any);
    sub(prefix: string): Hyperbee;

    put(key: any, value: any): Promise<void>;
    get(key: any): Promise<{ seq: number; key: any; value: any } | null>;

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

    feed: Hypercore;
    sep: Uint8Array;
  };
}
