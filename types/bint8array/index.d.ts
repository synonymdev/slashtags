declare module 'bint8array' {
  function toString(buf: Uint8Array, base: string): string;
  function fromString(buf: string, base: string): Uint8Array;
  function concat(bufs: Uint8Array[]): Uint8Array;
}
