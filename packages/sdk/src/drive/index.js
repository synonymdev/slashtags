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

const SubPrefixes = {
  headers: 'h',
  metadata: '/'
}

export class SlashDrive {
  constructor (opts) {
    this.opts = opts
    this.store = opts.store
    this.key = opts.key || opts.keyPair?.publicKey
    this.keys = opts.keys.namespace(this.key)

    this._ready = false
  }

  async ready () {
    if (this._ready) return

    const metadataCore = await this.store.get(this.opts)
    await metadataCore.ready()

    this.writable = metadataCore.writable

    this.db = new Hyperbee(metadataCore)
    this.metadata = this.db.sub(SubPrefixes.metadata)
    this.headers = this.db.sub(SubPrefixes.headers)

    this.discoveryKey = metadataCore.key
    this.findingPeers = metadataCore.findingPeers.bind(metadataCore)
    this.update = metadataCore.update.bind(metadataCore)
    this._ready = true
  }

  async _setupContent () {
    let contentCore
    if (this.writable) {
      const contentKeyPair = this.keys.generateKeyPair('content')
      contentCore = await this.store.get({ keyPair: contentKeyPair })
      await contentCore.ready()

      if (!(await this.headers.get(HeaderKeys.content))) {
        const batch = this.headers.batch()
        await batch.put(HeaderKeys.content, contentCore.key)
        await batch.put(HeaderKeys.version, b4a.from(VERSION))
        await batch.flush()
      }
    } else {
      const contentHeader = await this.headers.get(HeaderKeys.content)
      if (!contentHeader) throw new Error('Missing content key in headers')
      contentCore = await this.store.get({ key: contentHeader.value })
    }

    await contentCore.ready()
    this.content = new Hyperblobs(contentCore)
    debug('Created content core')
  }

  async write (path, content) {
    if (!this.writable) throw new Error('Drive is not writable')
    if (!this.content) await this._setupContent()

    const pointer = await this.content.put(content)
    await this.metadata.put(
      fixPath(path),
      c.encode(FileMetadata, { content: pointer })
    )
  }

  async read (path) {
    if (!this.content) await this._setupContent()

    path = fixPath(path)
    const block = await this.metadata.get(path)
    if (!block) return null

    const metadata = c.decode(FileMetadata, block.value)

    const blob = await this.content.get(metadata.content)

    return blob
  }

  async exists (path) {
    path = fixPath(path)
    let block
    if (isDirectory(path)) {
      block = await this.metadata.peek({ gte: path })
    } else {
      block = await this.metadata.get(path)
    }
    return Boolean(block)
    // TODO: handle private paths
  }

  async ls (path) {
    if (!isDirectory(path)) throw new Error('Can not list a file')
    if (!(await this.exists(path))) throw new Error('Directory does not exist')
    const prefix = fixPath(path)

    const ite = this.metadata.createRangeIterator({
      gte: prefix,
      // TODO: works for ASCII, handle UTF-8
      lt: prefix + '~'
    })

    await ite.open()
    let next = await ite.next()

    const paths = []

    while (next) {
      const key = b4a.toString(next.key)
      const withoutPrefix = key.slice(prefix.length)
      const withoutTrailingPath = withoutPrefix.replace(/\/.+/, '/')
      if (paths[paths.length - 1] !== withoutTrailingPath) {
        paths.push(withoutTrailingPath)
      }
      next = await ite.next()
    }

    return paths
  }
}

function fixPath (path) {
  return path.replace(/^\//, '')
}

function isDirectory (path) {
  return path.length === 0 || path.endsWith('/')
}
