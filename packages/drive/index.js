import Corestore from 'corestore'
import Hyperdrive from 'hyperdrive'
import Hyperbee from 'hyperbee'
import b4a from 'b4a'

const METADATA_KEY = 'slashtags-drivestore-metadata'

export class Drivestore {
  /**
   * @param {import('corestore')} corestore
   * @param {import('@hyperswarm/dht').KeyPair} keyPair
   */
  constructor (corestore, keyPair) {
    this.keyPair = keyPair
    this.corestore = fromcorestore(corestore, keyPair)

    const metadataCore = this.corestore.get({
      name: METADATA_KEY,
      encryptionKey: this.keyPair.secretKey
    })
    this._metadata = new Hyperbee(metadataCore, { keyEncoding: 'utf8' })
    this._drives = this._metadata.sub('drives')

    this._opening = this._open()
  }

  /** @returns {import('hyperbee').Iterator<{name: string}>} */
  [Symbol.asyncIterator] () {
    if (!this.opened) return emptyIterator
    const iterator = this._drives.createReadStream()[Symbol.asyncIterator]()
    return {
      async next () {
        const node = await iterator.next()
        const value = node.value
        return { done: node.done, value: value && { name: value.key } }
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

  /** @param {import('@hyperswarm/secret-stream')} socket */
  replicate (socket) {
    return this.corestore.replicate(socket)
  }

  /**
   * Get a Hyperdrive by its name.
   */
  get (name = 'public') {
    validateName(name)
    const ns = this.corestore.namespace(name)
    const _preload = ns._preload.bind(ns)
    ns._preload = (opts) => this._preload.bind(this)(opts, _preload, ns, name)
    return new Hyperdrive(ns)
  }

  /**
   * @param {Parameters<import('corestore')['get']>[0]} opts
   * @param {*} _preload
   * @param {import('corestore')} ns
   * @param {string} name
   */
  async _preload (opts, _preload, ns, name) {
    const isPublic = name === 'public'

    // Get keyPair programatically from name
    const options = await _preload(opts)

    if (!isPublic) {
      // Public drive cores should not be encrypted
      options.encryptionKey = ns._namespace

      // No need currently to save a record about the public drive
      await this._drives.ready()
      const saved = await this._drives.get(name)
      if (!saved) await this._drives.put(name, b4a.from(''))
      // TODO enable key rotation, where we overwrite keys, or use saved ones.
    }

    // Public drive files core should have the same keyPair as drivestore.keyPair
    if (isPublic && opts.name === 'db') {
      options.from = this.corestore.get({ keyPair: this.keyPair })
    }

    return options
  }
}

export default Drivestore

/**
 * @param {any} corestore
 * @param {import('@hyperswarm/dht').KeyPair} keyPair
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

/** @param {string} name */
function validateName (name) {
  if (!/^[0-9a-zA-Z-._ ]*$/.test(name)) throw new Error('Invalid drive name')
}

const emptyIterator = { async next () { return { done: true, value: null } } }
