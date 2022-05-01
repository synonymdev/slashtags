import Hyperbee from 'hyperbee'
import c from 'compact-encoding'
import Hyperblobs from 'hyperblobs'
import b4a from 'b4a'
import Debug from 'debug'
import EventEmitter from 'events'

import { ObjectMetadata } from './encoding.js'
import { collect, hash } from './utils.js'

const debug = Debug('slashtags:slashdrive')

const SEMVER = `${process.env.npm_package_version}`

const HeaderKeys = {
  content: 'c',
  semver: 'v'
}

const SubPrefixes = {
  headers: 'h',
  objects: 'o'
}

export class SlashDrive extends EventEmitter {
  /**
   *
   * @param {object} opts
   * @param {*} opts.store
   * @param {string} [opts.name]
   * @param {Uint8Array} [opts.key]
   * @param {import('hypercore').KeyPair} [opts.keyPair]
   * @param {boolean} [opts.encrypted]
   * @param {Uint8Array} [opts.encryptionKey]
   */
  constructor (opts) {
    super()
    this._opts = opts

    if (!(opts.key || opts.keyPair || opts.name)) {
      throw new Error('Missing keyPair, key, or name')
    }

    this._ready = false
  }

  get key () {
    return this.metadataDB?.feed.key
  }

  get discoveryKey () {
    return this.metadataDB?.feed.discoveryKey
  }

  get writable () {
    return (
      Boolean(this.metadataDB?.feed.writable) &&
      Boolean(this.content?.core.writable)
    )
  }

  get readable () {
    return (
      Boolean(this.metadataDB?.feed.readable) &&
      Boolean(this.content?.core.readable)
    )
  }

  async ready () {
    if (this._ready) return

    const opts = this._opts
    // @ts-ignore
    this._opts = undefined

    const writable = Boolean(opts.keyPair) || Boolean(opts.name)

    const metadataCoreOpts = writable
      ? await (async () => {
        const keyPair =
            opts.keyPair || (await opts.store.createKeyPair(opts.name))

        const encryptionKey = opts.encrypted && hash(keyPair.secretKey)

        return { keyPair, encryptionKey }
      })()
      : { key: opts.key, encryptionKey: opts.encryptionKey }

    this.store = opts.store.namespace(
      opts.name || opts.keyPair?.publicKey || opts.key
    )

    const metadataCore = await this.store.get(metadataCoreOpts)
    await metadataCore.ready()

    this.encryptionKey = metadataCore.encryptionKey

    this.db = new Hyperbee(metadataCore)
    this.metadataDB = this.db.sub(SubPrefixes.objects)
    this.headersDB = this.db.sub(SubPrefixes.headers)

    metadataCore.on('append', () => this.emit('update'))

    if (writable) {
      const contentCore = await this.store.get({
        name: 'content',
        encryptionKey: this.encryptionKey
      })
      await contentCore.ready()

      if (!(await this.headersDB.get(HeaderKeys.content))) {
        const batch = this.headersDB.batch()
        await batch.put(HeaderKeys.content, contentCore.key)
        await batch.put(HeaderKeys.semver, b4a.from(SEMVER))
        await batch.flush()
      }
      this.content = new Hyperblobs(contentCore)
    }

    this._ready = true
  }

  /**
   * Awaits for an updated length of the metdata core, and setup the content core if it doesn't already exist
   *
   */
  async update () {
    await this.ready()
    const updated = await this.metadataDB?.feed.update()
    await this._setupRemoteContent()
    return updated
  }

  /**
   * Returns a callback that informs this.update() that peer discovery is done
   * more at https://github.com/hypercore-protocol/hypercore-next/#const-done--corefindingpeers
   *
   * @returns {Promise<()=>void>}
   */
  async findingPeers () {
    await this.ready()
    // @ts-ignore
    return this.metadataDB?.feed.findingPeers()
  }

  /**
   *
   * @param {boolean} isInitiator
   * @param {*} opts
   * @returns
   */
  replicate (isInitiator, opts) {
    return this.store.replicate(isInitiator, opts)
  }

  async _setupRemoteContent () {
    if (this.content) return

    await validateRemote(this)
    const contentHeader = await this.headersDB?.get(HeaderKeys.content)
    if (!contentHeader?.value) {
      throw new Error('Missing content key in headers')
    }

    const contentCore = await this.store.get({
      key: contentHeader.value,
      encryptionKey: this.encryptionKey
    })

    await contentCore.ready()
    this.content = new Hyperblobs(contentCore)
  }

  /**
   *
   * @param {string} key
   * @param {Uint8Array} content
   * @param {object} [options]
   * @param {object} [options.metadata]
   */
  async put (key, content, options) {
    if (!this.writable) throw new Error('Drive is not writable')
    await this.ready()
    // TODO support streamable content

    const blobIndex = await this.content?.put(content)
    await this.metadataDB?.put(
      key,
      c.encode(ObjectMetadata, {
        blobIndex,
        userMetadata: options?.metadata
      })
    )
  }

  /**
   *
   * @param {string} key
   * @returns
   */
  async get (key) {
    if (!this.content) await this.update()

    const block = await this.metadataDB?.get(key)
    if (!block) return null

    const metadata = c.decode(ObjectMetadata, block.value)

    const blob = await this.content?.get(metadata.blobIndex)

    return blob
  }

  /**
   *
   * @param {string} prefix
   * @returns {Promise<Array<{key:string, metadata: Object}>>}
   */
  async list (prefix) {
    await this.ready()

    const options = {
      gte: prefix,
      // TODO: works for ASCII, handle UTF-8
      lt: prefix + '~'
    }
    const stream = this.metadataDB?.createReadStream(options)

    // @ts-ignore
    return collect(stream, (entry) => {
      const metadata = c.decode(ObjectMetadata, entry.value)

      return {
        key: b4a.toString(entry.key),
        metadata: {
          ...metadata.userMetadata,
          contentLength: metadata.blobIndex.byteLength
        }
      }
    })
  }
}

/**
 *
 * @param {SlashDrive} drive
 */
async function validateRemote (drive) {
  const metadataCore = drive.metadataDB?.feed

  await metadataCore?.update()

  // First block is hyperbee and the second is the content header
  if (metadataCore && metadataCore.length < 2) {
    throw new Error('Could not resolve remote drive')
  }

  try {
    await drive.headersDB?.get(HeaderKeys.content)
  } catch (error) {
    debug(
      'Corrupted remote drive',
      'error:',
      error,
      '\ncontent header block:',
      b4a.toString(await metadataCore?.get(1))
    )

    throw new Error('Encrypted or corrupt drive')
  }
}
