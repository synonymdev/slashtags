import Corestore from 'corestore'
import Hyperdrive from 'hyperdrive'
import Hyperbee from 'hyperbee'
import resolve from 'unix-path-resolve'
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

  /** @returns {import('hyperbee').Iterator<{path: string}>} */
  [Symbol.asyncIterator] () {
    if (!this.opened) return { async next () { return { done: true, value: null } } }
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

  /** @param {import('@hyperswarm/secret-stream')} socket */
  replicate (socket) {
    return this.corestore.replicate(socket)
  }

  get (path = '/public') {
    path = resolve(path)
    const ns = this.corestore.namespace(path)
    const drivestore = this
    const _preload = ns._preload.bind(ns)
    ns._preload = preload.bind(ns)

    return new Hyperdrive(ns)

    /**
     * @this {import('corestore')}
     * @param {Parameters<import('corestore')['get']>[0]} opts
     */
    async function preload (opts) {
      const isPublic = path === '/public'
      const { from } = await _preload(opts)

      await drivestore._saveMaybe(path)

      if (isPublic && opts.name === 'db') {
        return {
          from: drivestore.corestore.get({ keyPair: drivestore.keyPair })
        }
      }

      return { from, encryptionKey: !isPublic && this._namespace }
    }
  }

  /** @param {string} path */
  async _saveMaybe (path) {
    await this._drives.ready()
    if (await this._drives.get(path)) return
    return this._drives.put(path, b4a.from(''))
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
