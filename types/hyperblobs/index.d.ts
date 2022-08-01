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
