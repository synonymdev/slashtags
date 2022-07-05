declare module 'z32' {
  function encode(buf: Uint8Array): string;
  function decode(string: string): Uint8Array;

  export = {
    encode,
    decode,
  };
}
