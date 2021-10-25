declare module 'lru' {
  export = class LRU {
    constructor(options?: { maxAge: number });

    peek(key: string): any;
    length: number;
    set(key: string, value: any): void;
    get(key: string): any;
    on(event: 'evict', listener: ({ key: string, value: any }) => void): this;
  };
}
