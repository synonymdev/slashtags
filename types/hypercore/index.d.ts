declare module 'hypercore' {
  export = class Hypercore {
    constructor(opts: any);
    length: number;

    update(): Promise<void>;
    get(seq: nubmer): Promise<any>;

    findingPeers(): Promise<() => void>;
  };
}
