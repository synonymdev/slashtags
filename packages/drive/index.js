import Hyperdrive from 'hyperdrive'
import Hyperbee from 'hyperbee'
import safetyCatch from 'safety-catch'
import Keychain from 'keypear'
import b4a from 'b4a'

const NAMESPACE = 'slashdrive'
const METADATA_NAME = 'metadata'

export class Drivestore {
  /**
   * @param {import('corestore')} corestore
   * @param {import('keypear') | Uint8Array} [keychain]
   */
  constructor (corestore, keychain) {
    /** @type {import('corestore')} */
    this.corestore = corestore

    keychain = Keychain.from(keychain)
    this.signer = keychain.get()
    this.keychain = keychain.sub(NAMESPACE)

    if (this.writable) {
      const metadataSigner = this.keychain.get(METADATA_NAME)
      /** @type {import('hypercore')} */
      const metadataCore = this.corestore.get({
        ...metadataSigner,
        encryptionKey: metadataSigner.scalar
      })
      this._metadata = new Hyperbee(metadataCore, { keyEncoding: 'utf8' })
      this._drives = this._metadata.sub('drives')
    }

    this._opening = this._open().catch(safetyCatch)
    this._pending = Promise.resolve()
  }

  /** @returns {import('hyperbee').Iterator<{name: string}>} */
  [Symbol.asyncIterator] () {
    if (!this._drives || !this.opened) return emptyIterator
    const iterator = this._drives.createReadStream()[Symbol.asyncIterator]()
    return {
      async next () {
        const node = await iterator.next()
        const value = node.value
        return { done: node.done, value: value && { name: value.key } }
      }
    }
  }

  get key () {
    return this.signer.publicKey
  }

  get writable () {
    return !!this.keychain.get().scalar
  }

  get closed () {
    return this.corestore._root._closing
  }

  async _open () {
    await this._metadata?.feed.ready()
    this.opened = true
  }

  ready () {
    return this._opening
  }

  /** @param {Parameters<import('corestore')['replicate']>} args */
  replicate (...args) {
    return this.corestore.replicate(...args)
  }

  flush () {
    return this._pending
  }

  /**
   * Get a Hyperdrive by its name.
   * By default it returns the public unencrypted drive
   */
  get (name = 'public') {
    validateName(name)
    const drive = new Hyperdrive(this.corestore, this.keychain.sub(name), { encrypted: name !== 'public' })
    this._pending = this._pending.then(() => this._ondrive(name))
    return drive
  }

  /**
   * Set the correct and current key and encryption Key (enables future key rotation)
   * @param {string} name
   */
  async _ondrive (name) {
    if (this._drives) {
      await this.ready()
      const saved = await this._drives.get(name)
      if (!saved) await this._drives.put(name, b4a.from(''))
    }
  }
}

/** @param {string} name */
function validateName (name) {
  if (!/^[0-9a-zA-Z-._ ]*$/.test(name)) throw new Error('Invalid drive name')
}

const emptyIterator = { async next () { return { done: true, value: null } } }

export default Drivestore
