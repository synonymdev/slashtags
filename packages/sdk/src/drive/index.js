import Hyperbee from 'hyperbee'
import cenc from 'compact-encoding'
import { SlashDriveHeader, SlashDriveFileMetadata } from './encoding.js'
import Hyperblobs from 'hyperblobs'
import b4a from 'b4a'

export class SlashDrive {
  constructor (opts) {
    this.ready = (async () => {
      const cores =
        opts.name || opts.keyPair
          ? await writableCores(opts)
          : await readOnlyCores(opts)

      if (!cores) return null

      const db = new Hyperbee(cores.indexCore)
      this.driveDB = db.sub('/')

      this.blobs = new Hyperblobs(cores.blobsCore)
    })()
  }

  get key () {
    return this.driveDB.feed.key
  }

  static async init (opts) {
    const drive = new SlashDrive(opts)
    return (await drive.ready) === null ? null : drive
  }

  async write (path, content) {
    const index = await this.blobs.put(content)
    await this.driveDB.put(
      fixPath(path),
      cenc.encode(SlashDriveFileMetadata, { blobs: [index] })
    )
  }

  async read (path) {
    path = fixPath(path)
    const block = await this.driveDB.get(path)
    if (!block) return null

    const decoded = cenc.decode(SlashDriveFileMetadata, block.value)

    const blobs = []

    for (const index of decoded.blobs) {
      const blob = await this.blobs.get(index)
      blobs.push(blob)
    }

    return b4a.concat(blobs)
  }
}

function fixPath (path) {
  return path.replace(/^\//, '')
}

async function writableCores (opts) {
  const { sdk } = opts
  opts.keyPair = opts.keyPair || sdk.keys.createKeyPair(opts.name)

  const indexCore = await sdk.hypercore(opts)

  const blobsCore = await sdk.hypercore({
    name: 'slashdrive:blobs',
    keys: sdk.keys.namespace(indexCore.key)
  })

  const header = { blobsKey: blobsCore.key }
  const encodedHeader = cenc.encode(SlashDriveHeader, header)
  await indexCore.append(encodedHeader)

  return { blobsCore, indexCore }
}

async function readOnlyCores (opts) {
  const { sdk } = opts
  const indexCore = await sdk.hypercore(opts)

  // TODO: don't await the swarm to flush, if core.update() patch was shipped
  await sdk.swarm.flush()
  await indexCore.update()

  if (indexCore.length === 0) return null

  const header = await indexCore.get(0)
  const decodedHeader = cenc.decode(SlashDriveHeader, header)
  const { blobsKey } = decodedHeader

  const blobsCore = await sdk.hypercore({ key: blobsKey })

  return { blobsCore, indexCore }
}
