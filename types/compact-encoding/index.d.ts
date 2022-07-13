declare module 'compact-encoding' {
  function from(opts: object): object;
  function decode(enc: object, val: Uint8Array): any;
  function encode(enc: object, val: any);

  let uint: Encoding;
  let fixed32: Encoding;
  let string: Encoding;
  let raw: Encoding;

  interface Encoding {
    preencode(
      state: { start: number; end: number; buffer: Uint8Array },
      val: any,
    ): void;
    encode(
      state: { start: number; end: number; buffer: Uint8Array },
      val: any,
    ): void;
    decode(buffer): any;
  }
}

declare module 'compact-encoding-struct' {
  import type { Encoding } from 'compact-encoding';

  function compile(opts: Recored<string, Encoding>): object;
  function opt(enc: any, def: any): object;
}
