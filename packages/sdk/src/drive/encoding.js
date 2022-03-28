import cenc from 'compact-encoding'
import { compile } from 'compact-encoding-struct'

export const SlashDriveHeader = compile({
  blobsKey: cenc.buffer
})

export const SlashDriveBlobIndex = compile({
  byteOffset: cenc.uint,
  blockOffset: cenc.uint,
  blockLength: cenc.uint,
  byteLength: cenc.uint
})

export const SlashDriveFileMetadata = compile({
  blobs: cenc.array(SlashDriveBlobIndex)
})
