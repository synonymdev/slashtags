declare module 'blake2b-universal' {
  function batch(
    output: Buffer | Uint8Array,
    batch: Array<Buffer | Uint8Array>,
    key: Buffer | Uint8Array,
  ): Buffer;
}
