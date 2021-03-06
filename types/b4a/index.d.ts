declare module 'b4a' {
  function toString(
    buf: Buffer | Uint8Array,
    encoding?: 'hex' | 'base64' | 'utf8' | 'utf16le' | 'ascii',
  ): string;
  function isBuffer(value: any): boolean;
  function alloc(n: number): Buffer;
  function allocUnsafe(n: number): Buffer;
  function from(
    input: string | Uint8Array | number[],
    encoding?: 'hex' | 'base64' | 'utf8' | 'utf16le' | 'ascii',
  ): Buffer;
  function byteLength(
    input: string | Buffer,
    encoding?: 'hex' | 'base64' | 'utf8' | 'utf16le' | 'ascii',
  ): number;
  function concat(args: Array<Uint8Array>): Uint8Array;
  function equals(buf: Uint8Array, buf2: Uint8Array): boolean;
}
