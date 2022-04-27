import Corestore from 'corestore'
import { DHT } from 'dht-universal'
import RAM from 'random-access-memory'
import goodbye from 'graceful-goodbye'
import HashMap from 'turbo-hash-map'

import { createKeyPair, randomBytes } from './crypto.js'
import { Slashtag } from './slashtag.js'
import { storage } from './storage.js'
import { parseURL } from './url.js'

export class SDK {
  constructor (opts) {
    this.storage = opts.persistent === false ? RAM : storage(opts.storage)
    this.store = new Corestore(this.storage)
    this.opts = opts

    this.primaryKey = opts.primaryKey || randomBytes(32)

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

  /**
   * Generates a Slashtag keypair from a name, and the `SDK.primaryKey`.
   *
   * @param {string} name
   */
  createKeyPair (name) {
    return createKeyPair(this.primaryKey, name)
  }

  slashtag (opts) {
    const keyPair =
      opts.keyPair || (opts.name && this.createKeyPair(opts.name))

    const key =
      opts.key || keyPair?.publicKey || (opts.url && parseURL(opts.url).key)

    let slashtag = this.slashtags.get(key)
    if (slashtag) return slashtag

    slashtag = new Slashtag({ ...opts, sdk: this, keyPair, key })
    this.slashtags.set(slashtag.key, slashtag)

    slashtag.on('close', () => {
      if (!this.closed) this.slashtags.delete(slashtag.key)
    })

    return slashtag
  }

  async close () {
    if (this.closed) return
    this.closed = true
    for (const slashtag of this.slashtags.values()) {
      await slashtag.close()
    }
    await this.store.close()
    await this.dht.destroy()
  }
}
