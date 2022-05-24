declare module 'compact-encoding' {
  function from(opts: object): object;
  function decode(enc: object, val: Uint8Array): any;
  function encode(enc: object, val: any);

  let uint: Encoding;
  let fixed32: Encoding;
  let string: Encoding;

  interface Encoding {
    preencode(): void;
    encode(val: any): void;
    decode(): any;
  }
}

declare module 'compact-encoding-struct' {
  import type { Encoding } from 'compact-encoding';

  function compile(opts: Recored<string, Encoding>): object;
  function opt(enc: any, def: any): object;
}
