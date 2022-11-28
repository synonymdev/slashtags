import Hyperdrive from 'hyperdrive'
import Hyperbee from 'hyperbee'
import b4a from 'b4a'
import safetyCatch from 'safety-catch'

const METADATA_KEY = 'slashtags-drivestore-metadata'

export class Drivestore {
  /**
   * @param {import('corestore')} corestore
   * @param {import('@hyperswarm/dht').KeyPair} keyPair
   */
  constructor (corestore, keyPair) {
    this.fava = Math.random()
    this.keyPair = keyPair
    /** @type {import('corestore')} */
    this.corestore = corestore.session({ primaryKey: this.keyPair.secretKey, namespace: null })

    const metadataCore = this.corestore.get({
      name: METADATA_KEY,
      encryptionKey: this.keyPair.secretKey
    })
    this._metadata = new Hyperbee(metadataCore, { keyEncoding: 'utf8' })
    this._drives = this._metadata.sub('drives')

    this._opening = this._open().catch(safetyCatch)
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

  get closed () {
    return this.corestore._root._closing
  }

  async _open () {
    await this._drives.feed.ready()
    this.opened = true
  }

  ready () {
    return this._opening
  }

  /** @param {Parameters<import('corestore')['replicate']>} args */
  replicate (...args) {
    return this.corestore.replicate(...args)
  }

  /**
   * Get a Hyperdrive by its name.
   */
  get (name = 'public') {
    validateName(name)
    const ns = this.corestore.namespace(name).session({ primaryKey: this.keyPair.secretKey })
    const _preload = ns._preload.bind(ns)
    ns._preload = (opts) => this._preload.bind(this)(opts, _preload, ns, name)
    return new Hyperdrive(ns)
  }

  /**
   * Set the correct and current key and encryption Key (enables future key rotation)
   * @param {Parameters<import('corestore')['get']>[0]} opts
   * @param {*} preload orginal ns._preload
   * @param {import('corestore')} ns
   * @param {string} name
   * @returns {Promise<any>}
   */
  async _preload (opts, preload, ns, name) {
    const isPublic = name === 'public'

    // Get keyPair programatically from name
    const { from } = await preload(opts)

    // public drive needs no encryption
    // No need currently to save a record about the public drive
    if (isPublic) {
      if (opts.name !== 'db') return { from }
      const session = this.corestore.get({ keyPair: this.keyPair })
      await session.ready()
      return { from: session }
    }

    this._drives.ready().then(async () => {
      const saved = await this._drives.get(name)
      if (!saved) await this._drives.put(name, b4a.from(''))
      // TODO enable key rotation, where we overwrite keys, or use saved ones.
      // TODO block closing drivestore before this update is flushed
    })

    // Add encryption keys for non public drives
    return { from, encryptionKey: ns._namespace }
  }
}

/** @param {string} name */
function validateName (name) {
  if (!/^[0-9a-zA-Z-._ ]*$/.test(name)) throw new Error('Invalid drive name')
}

const emptyIterator = { async next () { return { done: true, value: null } } }

export default Drivestore
