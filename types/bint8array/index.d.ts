declare module 'bint8array' {
  function toString(buf: Uint8Array, base: string): string;
  function concat(bufs: Uint8Array[]): Uint8Array;
}
