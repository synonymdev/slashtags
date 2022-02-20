declare module 'b4a' {
  function toString(
    buf: Uint8Array,
    encoding?: 'hex' | 'base64' | 'utf8' | 'utf16le' | 'ascii',
  ): string;
  function isBuffer(value: any): boolean;
  function from(
    buf: Uint8Array | string,
    encoding?: 'hex' | 'base64' | 'utf8' | 'utf16le' | 'ascii',
  ): Uint8Array;
  function byteLength(buf: Uint8Array): number;
  function alloc(size: number): Buffer;
}
