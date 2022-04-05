import c from 'compact-encoding'
import { compile } from 'compact-encoding-struct'

export const Header = compile({
  type: c.string,
  blobsKey: c.buffer
})

export const BlobIndex = compile({
  byteOffset: c.uint,
  blockOffset: c.uint,
  blockLength: c.uint,
  byteLength: c.uint
})

export const FileMetadata = compile({
  blobs: c.array(BlobIndex)
})
