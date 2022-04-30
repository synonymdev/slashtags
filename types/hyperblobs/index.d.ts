declare module 'hyperblobs' {
  import type Hypercore from 'hypercore';
  export = class Hyperblobs {
    constructor(core: Hypercore);

    put(blob: Uint8Array): Promise<{
      byteOffset: number;
      blockOffset: number;
      blockLength: number;
      byteLength: number;
    }>;
    get(key: any): Promise<Uint8Array | null>;
  };
}
