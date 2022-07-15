import Hyperbee from 'hyperbee'
import c from 'compact-encoding'
import Hyperblobs from 'hyperblobs'
import b4a from 'b4a'
import Debug from 'debug'
import EventEmitter from 'events'
// @ts-ignore
import { Header } from 'hyperbee/lib/messages.js'

import { ObjectMetadata } from './encoding.js'
import { hash } from './utils.js'

const debug = Debug('slashtags:slashdrive')

const SubPrefixes = {
  objects: 'o'
}

const HEX_FF = b4a.toString(b4a.from('ff', 'hex'))

export class SlashDrive extends EventEmitter {
  /**
   *
   * @param {object} opts
   * @param {*} opts.store
   * @param {Uint8Array} [opts.key]
   * @param {import('./interfaces').KeyPair} [opts.keyPair]
   * @param {boolean} [opts.encrypted]
   * @param {Uint8Array} [opts.encryptionKey]
   */
  constructor (opts) {
    super()

    if (!(opts.key || opts.keyPair)) {
      throw new Error('Missing keyPair, or key')
    }

    this.store = opts.store.namespace(opts.keyPair?.publicKey || opts.key)

    this.encryptionKey = opts.encryptionKey

    if (opts.keyPair && opts.encrypted) {
      this.encryptionKey = hash(opts.keyPair.secretKey)
    }

    // Initiate the drive with a non encrypted feed to read/write header block
    this.feed = this.store.get({
      keyPair: opts.keyPair,
      key: opts.key,
      encryptionKey: this.encryptionKey
    })

    this.db = new Hyperbee(this.feed)
    this.objects = this.db.sub(SubPrefixes.objects)

    this.feed.on('append', this._onAppend.bind(this))

    this._ready = false
  }

  [Symbol.asyncIterator] () {
    return this.entries()[Symbol.asyncIterator]()
  }

  get key () {
    return this.feed.key
  }

  /** @type {Uint8Array} */
  get discoveryKey () {
    return this.feed.discoveryKey
  }

  get contentKey () {
    return this.content?.core.key
  }

  get writable () {
    return Boolean(this.feed.writable) && Boolean(this.content?.core.writable)
  }

  get readable () {
    return Boolean(this.feed.readable) && Boolean(this.content?.core.readable)
  }

  get peers () {
    return this.feed.peers
  }

  get online () {
    return this.feed.peers.length > 0
  }

  async ready () {
    if (this._ready) return
    this._ready = true

    await this.feed.ready()

    if (this.feed.writable) {
      await this._openContent()
    } else {
      await this._openContentFromHeader()
    }

    debug('Opened drive')
  }

  /**
   * Awaits for an updated length of the metdata core,
   * and setup the content core if it doesn't already exist
   */
  async update () {
    await this.ready()
    const updated = await this.feed.update()
    await this._openContentFromHeader()
    return updated
  }

  /**
   * Returns a callback that informs this.update() that peer discovery is done
   * more at https://github.com/hypercore-protocol/hypercore-next/#const-done--corefindingpeers
   *
   * @returns {()=>void}
   */
  findingPeers () {
    return this.feed.findingPeers()
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

  /**
   *
   * @param {string} key
   * @param {Uint8Array} content
   * @param {object} [options]
   * @param {object} [options.metadata]
   */
  async put (key, content, options) {
    // TODO support streamable content
    await this.ready()
    if (!this.writable) throw new Error('Drive is not writable')

    const blobIndex = await this.content?.put(content)
    await this.objects?.put(
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

    const block = await this.objects?.get(key, {
      update: this.online
    })
    if (!block) return null

    const metadata = c.decode(ObjectMetadata, block.value)

    const blob = await this.content?.get(metadata.blobIndex)

    return blob
  }

  /**
   * @param {object} [opts]
   * @param {string} [opts.prefix]
   * @param {string} [opts.gt]
   * @param {string} [opts.gte]
   * @param {string} [opts.lt]
   * @param {string} [opts.lte]
   * @param {string} [opts.reverse]
   * @param {number} [opts.limit]
   */
  entries (opts) {
    const options = {
      gte: opts?.prefix,
      lt: opts?.prefix + HEX_FF,
      ...opts,
      update: this.online
    }

    return this.objects.createReadStream(options)
  }

  /**
   *
   * @param {string} [prefix]
   * @param {object} [opts]
   * @param {boolean} [opts.content]
   * @param {boolean} [opts.metadata]
   */
  async list (prefix, opts = { metadata: false, content: false }) {
    const stream = this.entries({ prefix })

    const result = []

    for await (const entry of stream) {
      const key = b4a.toString(entry.key)

      /** @type {{key: string, metadata?: Object, content?: Uint8Array | null}} */
      const item = { key }

      let metadata

      if (opts.metadata) {
        metadata = c.decode(ObjectMetadata, entry.value)

        item.metadata = {
          ...metadata.userMetadata,
          contentLength: metadata.blobIndex.byteLength
        }
      }

      if (opts.content) {
        metadata = metadata || c.decode(ObjectMetadata, entry.value)
        item.content = await this.content?.get(metadata.blobIndex)
      }

      result.push(item)
    }

    return result
  }

  async download () {
    if (!this.content) await this.update()
    const downloadedFeed = this.feed.download()
    const contentDownloaded = this.content?.core.download()
    return Promise.allSettled([downloadedFeed, contentDownloaded])
  }

  async _onAppend () {
    if (!this.readable) return
    if (!this.db?.feed.readable) return

    const seq = this.feed.length - 1
    if (seq === 0) return // Not part of the tree
    const block = await this.db?.getBlock(seq, {})

    if (!block || !block.key) return
    const [prefix, key] = b4a
      .toString(block.key)
      .split(b4a.toString(this.db.sep))

    if (prefix === SubPrefixes.objects) {
      this.emit('update', {
        seq,
        type: block.isDeletion() ? 'del' : 'put',
        key
      })
    }
  }

  async _openContentFromHeader () {
    if (this.content) return

    await this.feed.update()
    if (this.feed.length === 0) return
    // TODO figure out a better solution that doesn't depend on private method
    const block = await this.feed._get(0)
    const header = Header.decode(block)

    if (!header?.metadata?.contentFeed) return false

    const core = await this.store.get({
      key: header.metadata.contentFeed,
      encryptionKey: this.encryptionKey
    })
    await core.update()
    this.content = new Hyperblobs(core)
  }

  async _openContent () {
    if (this.content) return

    const core = this.store.get({
      name: 'content',
      encryptionKey: this.encryptionKey
    })
    await core.ready()
    this.content = new Hyperblobs(core)

    if (this.feed.length === 0) {
      const header = Header.encode({
        protocol: 'slashdrive',
        metadata: { contentFeed: core.key }
      })
      // TODO figure out a better solution that doesn't depend on private method
      await this.feed.core.append([header], this.feed.auth)
    }
  }
}

/**
 * @typedef {import ('./interfaces').EventsListeners } EventsListeners
 */
