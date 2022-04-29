declare module 'compact-encoding' {
  function uint() {}
  function from(opts: object): object;
  function decode(enc: object, val: Uint8Array): any;
  function encode(enc: object, val: any);
}

declare module 'compact-encoding-struct' {
  function compile(opts: object): object;
  function opt(enc: any, def: any): object;
}
