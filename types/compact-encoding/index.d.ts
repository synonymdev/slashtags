declare module 'compact-encoding' {
  function from(opts: object): object;
  function decode(enc: Encoding, val: Uint8Array): any;
  function encode(enc: Encoding, val: any);

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

  let flag: Encoding;

  function compile(opts: { [key: string]: Encoding }): Encoding;
  function opt(enc: any, def: any): Encoding;
}
