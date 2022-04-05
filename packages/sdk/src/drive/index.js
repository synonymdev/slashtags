import Hyperbee from 'hyperbee'
import c from 'compact-encoding'
import { Header, FileMetadata } from './encoding.js'
import Hyperblobs from 'hyperblobs'
import b4a from 'b4a'
import Debug from 'debug'

const debug = Debug('slashtags:slashdrive')

const TYPE = 'slashdrive:alpha'

export class SlashDrive {
  constructor (opts) {
    this.opts = opts
    this.sdk = opts.sdk
    this.swarm = opts.swarm
    this.key = opts.key || opts.keyPair?.publicKey
    this.keys = this.sdk.keys.namespace(this.key)

    this._ready = false
  }

  async ready () {
    if (this._ready) return

    const cores = this.opts.keyPair
      ? await setupWritableCores(this)
      : await setupReadOnlyCores(this)

    debug('Found cores', {
      indexCore: b4a.toString(cores?.indexCore.key, 'hex'),
      blobsCore: b4a.toString(cores?.blobsCore.key, 'hex')
    })

    const db = new Hyperbee(cores.indexCore)
    this.driveDB = db.sub('/')

    this.blobs = new Hyperblobs(cores.blobsCore)

    this._ready = true
  }

  async write (path, content) {
    const index = await this.blobs.put(content)
    await this.driveDB.put(
      fixPath(path),
      c.encode(FileMetadata, { blobs: [index] })
    )
  }

  async read (path) {
    path = fixPath(path)
    const block = await this.driveDB.get(path)
    if (!block) return null

    const decoded = c.decode(FileMetadata, block.value)

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

async function setupWritableCores (drive) {
  debug('Fetching writable cores')
  const indexCore = await drive.sdk.store.get(drive.opts)
  await indexCore.ready()

  const blobsKeyPair = drive.keys.generateKeyPair('blobs')
  const blobsCore = await drive.sdk.store.get({ keyPair: blobsKeyPair })
  await blobsCore.ready()

  const header = { type: TYPE, blobsKey: blobsCore.key }
  const encodedHeader = c.encode(Header, header)
  await indexCore.append(encodedHeader)

  // TODO custom discovery options
  await drive.swarm?.join(indexCore.discoveryKey).flushed()

  return { blobsCore, indexCore }
}

async function setupReadOnlyCores (drive) {
  debug('Fetching readonly cores')
  const indexCore = await drive.sdk.store.get(drive.opts)
  await indexCore.ready()
  // TODO custom discovery options
  drive.swarm.join(indexCore.discoveryKey)

  // TODO test the findingPeers() api again after updating corestore
  // const done = indexCore.findingPeers()
  // drive.swarm.flush().then(done, done)
  await drive.swarm.flush()
  await indexCore.update()

  if (indexCore.length === 0) throw new Error('Could not resolve remote drive')

  const header = await indexCore.get(0)
  const decodedHeader = c.decode(Header, header)
  const { blobsKey } = decodedHeader

  debug('Found Blobs core key', b4a.toString(blobsKey, 'hex'))
  const blobsCore = await drive.sdk.store.get({ key: blobsKey })
  await blobsCore.ready()

  return { blobsCore, indexCore }
}
