import Corestore from 'corestore'
import { DHT } from 'dht-universal'
import RAM from 'random-access-memory'
import goodbye from 'graceful-goodbye'
import HashMap from 'turbo-hash-map'

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

  async slashtag (opts) {
    await this.ready

    const keyPair = opts.keyPair || this.generateKeyPair(opts.name)
    let slashtag = this.slashtags.get(keyPair.publicKey)
    if (slashtag) return slashtag

    slashtag = new Slashtag({ sdk: this, keyPair })
    this.slashtags.set(slashtag.key, slashtag)
    return slashtag
  }

  async close () {
    for (const slashtag of this.slashtags.values()) {
      await slashtag.close()
    }

    this.dht.destroy()
  }
}
