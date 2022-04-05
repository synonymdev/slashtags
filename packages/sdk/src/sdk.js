import Corestore from 'corestore'
import { DHT } from 'dht-universal'
import RAM from 'random-access-memory'
import goodbye from 'graceful-goodbye'
import HashMap from 'turbo-hash-map'
import b32 from 'hi-base32'
import b4a from 'b4a'

import { KeyManager } from './keys.js'
import { Slashtag } from './slashtag.js'

export class SDK {
  constructor (opts) {
    this.store = new Corestore(opts.storage || RAM)
    this.keys = new KeyManager(opts?.seed)
    this.opts = opts

    this.slashtags = new HashMap()

    this.ready = (async () => {
      this.dht = await DHT.create(this.opts)
      return true
    })()

    // Gracefully shutdown
    goodbye(() => {
      return this.close()
    })
  }

  static async init (opts) {
    const sdk = new SDK(opts)
    await sdk.ready
    return sdk
  }

  generateKeyPair (name, keys = this.keys) {
    return keys.generateKeyPair(name)
  }

  slashtag (opts) {
    const keyPair =
      opts.keyPair || (opts.name && this.keys.generateKeyPair(opts.name))

    const key =
      opts.key ||
      keyPair?.publicKey ||
      (opts.url && SDK.parseURL(opts.url).key)

    if (!key) {
      throw new Error('Missing keyPair, key or url')
    }

    let slashtag = this.slashtags.get(key)
    if (slashtag) return slashtag

    slashtag = new Slashtag({ ...opts, sdk: this, keyPair, key })
    this.slashtags.set(slashtag.key, slashtag)
    return slashtag
  }

  async close () {
    for (const slashtag of this.slashtags.values()) {
      await slashtag.close()
    }

    this.dht.destroy()
  }

  static formatURL (key) {
    return 'slash://' + toBase32(key)
  }

  static parseURL (url) {
    const parsed = {}
    parsed.protocol = url.split('://')[0]
    url = new URL(url.replace(/^.*:\/\//, 'http://'))
    parsed.key = fromBase32(url.hostname)
    parsed.query = url.searchParams

    return parsed
  }
}

function toBase32 (buf) {
  return b32.encode(b4a.from(buf)).replace(/[=]/g, '').toLowerCase()
}

function fromBase32 (str) {
  return b4a.from(b32.decode.asBytes(str.toUpperCase()))
}
