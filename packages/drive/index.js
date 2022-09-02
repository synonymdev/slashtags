import EventEmitter from 'events'
import Corestore from 'corestore'
import Hyperdrive from 'hyperdrive'
import Hyperbee from 'hyperbee'
import resolve from 'unix-path-resolve'

const METADATA_KEY = 'slashtags-drivestore-metadata'

export class Drivestore extends EventEmitter {
  /**
   * @param {import('corestore')} corestore
   * @param {import('hypercore').KeyPair} keyPair
   */
  constructor (corestore, keyPair) {
    super()
    this.keyPair = keyPair
    this.corestore = fromcorestore(corestore, keyPair)

    this._metadata = new Hyperbee(corestore.get({ name: METADATA_KEY }), {
      keyEncoding: 'utf8'
    })
    this._drives = this._metadata.sub('drives')

    this._public = makePublicDrive(corestore, keyPair)
    this._handleDrive('/public')

    this._opening = this._open()
  }

  [Symbol.asyncIterator] () {
    if (!this.opened) return { async next () { return { done: true } } }
    const iterator = this._drives.createReadStream()[Symbol.asyncIterator]()
    return {
      async next () {
        const node = await iterator.next()
        const value = node.value
        return { done: node.done, value: value && { path: value.key } }
      }
    }
  }

  async _open () {
    await this._drives.feed.ready()
    this.opened = true
  }

  ready () {
    return this._opening
  }

  async flush () {
    await this.ready()
    return this._pending
  }

  /** @param {import('@hyperswarm/secret-stream')} socket */
  replicate (socket) {
    return this.corestore.replicate(socket)
  }

  /**
   * Return a Hyperdrive session for the given path.
   * @param {string} path
   */
  get (path = '/public') {
    if (path === '/public') return this._public

    path = resolve(path)
    const ns = this.corestore.namespace(path)
    const encryptionKey = ns._namespace
    const drive = new Hyperdrive(ns, { encryptionKey })

    this._handleDrive(path)
    return drive
  }

  /** @param {string} path */
  _handleDrive (path) {
    this._pending = Promise.all([this._pending, this._saveMaybe(path)])
  }

  /** @param {string} path */
  async _saveMaybe (path) {
    await this._drives.ready()
    if (await this._drives.get(path)) return
    return this._drives.put(path, '')
  }

  async close () {
    await this.flush()
    return this.corestore.close()
  }
}

export default Drivestore

/**
 * @param {any} corestore
 * @param {import('hypercore').KeyPair} keyPair
 */
function fromcorestore (corestore, keyPair) {
  return new Corestore(corestore.storage, {
    primaryKey: keyPair.secretKey,
    cache: corestore.cache,
    _opening: corestore._opening,
    _cores: corestore.cores,
    _streams: corestore._replicationStreams,
    _streamSessions: corestore._streamSessions
  })
}

/**
 * @param {import('corestore')} corestore
 * @param {import('hypercore').KeyPair} keyPair
 */
function makePublicDrive (corestore, keyPair) {
  const core = corestore.get({ keyPair })
  const db = new Hyperbee(core, {
    keyEncoding: 'utf8',
    valueEncoding: 'json',
    metadata: {}
  })
  return new Hyperdrive(corestore, { _db: db })
}
