import Hyperbee from 'hyperbee'
import c from 'compact-encoding'
import Hyperblobs from 'hyperblobs'
import b4a from 'b4a'
import Debug from 'debug'
import EventEmitter from 'events'
// @ts-ignore
import { Header } from 'hyperbee/lib/messages.js'

import { ObjectMetadata } from './encoding.js'
import { collect, hash } from './utils.js'

const debug = Debug('slashtags:slashdrive')

const SubPrefixes = {
  objects: 'o'
}

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
      key: opts.key
    })

    this._ready = false
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

    await _openContentFromHeader(this)

    if (!this.content && this.feed.writable) {
      // Setup content
      const core = this.store.get({
        name: 'content',
        encryptionKey: this.encryptionKey
      })
      await core.ready()
      this.content = new Hyperblobs(core)

      if (this.feed.length === 0) {
        const session = this.feed.session()
        await session.ready()
        await session.append(
          Header.encode({
            protocol: 'slashdrive',
            metadata: { contentFeed: core.key }
          })
        )
        session.close()
      }
    }

    this.feed = this.store.get({
      key: this.feed.key,
      auth: this.feed.auth
    })

    this.feed.on('append', this._onAppend.bind(this))
    this.db = new Hyperbee(this.feed)
    this.objects = this.db.sub(SubPrefixes.objects)

    await this.feed.ready()

    debug('Opened drive')
  }

  /**
   * Awaits for an updated length of the metdata core,
   * and setup the content core if it doesn't already exist
   */
  async update () {
    await this.ready()
    const updated = await this.feed.update()
    await _openContentFromHeader(this)
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
   *
   * @param {string} prefix
   * @returns {Promise<Array<{key:string, metadata: Object}>>}
   */
  async list (prefix) {
    if (!this.content) await this.update()

    const options = {
      gte: prefix,
      lt: prefix + '~',
      update: this.online
    }
    const stream = this.objects?.createReadStream(options)

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

  /**
   * @returns
   */
  async download () {
    if (!this.content) await this.update()
    const downloadedFeed = this.feed.download()
    // process.title === 'node' && (await this.content?.core.update());
    const contentDownloaded = this.content?.core.download()
    return Promise.all([downloadedFeed, contentDownloaded])
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
}

/**
 *
 * @param {SlashDrive} drive
 * @returns
 */
async function _openContentFromHeader (drive) {
  if (drive.content) return

  await drive.feed.update()
  if (drive.feed.length === 0) return
  const session = drive.feed.session()
  await session.ready()
  const block = await session.get(0)
  const header = Header.decode(block)
  session.close()

  if (!header?.metadata?.contentFeed) return false

  const core = await drive.store.get({
    key: header.metadata.contentFeed,
    encryptionKey: drive.encryptionKey
  })
  await core.update()
  drive.content = new Hyperblobs(core)
}

/**
 * @typedef {import ('./interfaces').EventsListeners } EventsListeners
 */
