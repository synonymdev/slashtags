import c from 'compact-encoding'
import { compile } from 'compact-encoding-struct'

export const BlobIndex = compile({
  byteOffset: c.uint,
  blockOffset: c.uint,
  blockLength: c.uint,
  byteLength: c.uint
})

export const FileMetadata = compile({
  content: BlobIndex
})
