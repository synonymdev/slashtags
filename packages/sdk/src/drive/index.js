import Hyperbee from 'hyperbee'
import c from 'compact-encoding'
import { FileMetadata } from './encoding.js'
import Hyperblobs from 'hyperblobs'
import b4a from 'b4a'
import Debug from 'debug'

const debug = Debug('slashtags:slashdrive')

const VERSION = '0.1.0-alpha.2'

const HeaderKeys = {
  content: 'c',
  version: 'v'
}

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

    const { metadataCore, contentCore, db, headers } = this.opts.keyPair
      ? await setupWritableCores(this)
      : await setupReadOnlyCores(this)

    debug('Found cores', {
      metadataCore: b4a.toString(metadataCore.key, 'hex'),
      contentCore: b4a.toString(contentCore.key, 'hex')
    })

    this.metadata = db.sub('/')
    this.headers = headers
    this.content = new Hyperblobs(contentCore)

    this._ready = true
  }

  async write (path, content) {
    const pointer = await this.content.put(content)
    await this.metadata.put(
      fixPath(path),
      c.encode(FileMetadata, { content: pointer })
    )
  }

  async read (path) {
    path = fixPath(path)
    const block = await this.metadata.get(path)
    if (!block) return null

    const metadata = c.decode(FileMetadata, block.value)

    const blob = await this.content.get(metadata.content)

    return blob
  }
}

function fixPath (path) {
  return path.replace(/^\//, '')
}

async function setupWritableCores (drive) {
  debug('Fetching writable cores')
  const metadataCore = await drive.sdk.store.get(drive.opts)
  await metadataCore.ready()

  const contentKeyPair = drive.keys.generateKeyPair('content')
  const contentCore = await drive.sdk.store.get({ keyPair: contentKeyPair })
  await contentCore.ready()

  // TODO custom discovery options
  await drive.swarm?.join(metadataCore.discoveryKey).flushed()

  const db = new Hyperbee(metadataCore)
  const headers = db.sub('h')

  if (!(await headers.get(HeaderKeys.content))) {
    const batch = headers.batch()
    await batch.put(HeaderKeys.content, contentCore.key)
    await batch.put(HeaderKeys.version, b4a.from(VERSION))
    await batch.flush()
  }

  return { contentCore, metadataCore, db, headers }
}

async function setupReadOnlyCores (drive) {
  debug('Fetching readonly cores')
  const metadataCore = await drive.sdk.store.get(drive.opts)
  await metadataCore.ready()
  // TODO custom discovery options
  drive.swarm.join(metadataCore.discoveryKey)

  const done = metadataCore.findingPeers()
  drive.swarm.flush().then(done, done)
  await metadataCore.update()

  if (metadataCore.length === 0) {
    throw new Error('Could not resolve remote drive')
  }

  const db = new Hyperbee(metadataCore)
  const headers = db.sub('h')

  const { value: contentKey } = await headers.get(HeaderKeys.content)

  debug('Found content key', b4a.toString(contentKey, 'hex'))
  const contentCore = await drive.sdk.store.get({ key: contentKey })
  await contentCore.ready()

  return { contentCore, metadataCore, db, headers }
}
