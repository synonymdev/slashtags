import c from 'compact-encoding'
import { compile, opt } from 'compact-encoding-struct'
import b4a from 'b4a'

export const BlobIndex = compile({
  byteOffset: c.uint,
  blockOffset: c.uint,
  blockLength: c.uint,
  byteLength: c.uint
})

const json = c.from({
  /** @param {Object} json */
  encode (json) {
    return b4a.from(JSON.stringify(json))
  },
  /** @param {Uint8Array} buf */
  decode (buf) {
    return JSON.parse(b4a.toString(buf))
  }
})

export const ObjectMetadata = compile({
  blobIndex: BlobIndex,
  userMetadata: opt(json, {})
})
