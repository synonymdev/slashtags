import Corestore from 'corestore'
import { DHT } from 'dht-universal'
import RAM from 'random-access-memory'
import goodbye from 'graceful-goodbye'
import HashMap from 'turbo-hash-map'
import Debug from 'debug'
import { Slashtag } from '@synonymdev/slashtag'

import { storage } from './storage.js'
import { protocolsList } from './protocols.js'

const debug = Debug('slashtags:sdk')

export class SDK {
  /**
   *
   * @param {object} opts
   * @param {string} [opts.storage]
   * @param {boolean} [opts.persistent]
   * @param {Uint8Array} [opts.primaryKey]
   * @param {string[]} [opts.relays]
   * @param {import('dht-universal').DHTOpts['bootstrap']} [opts.bootstrap]
   * @param {Array<typeof import('@synonymdev/slashtag').SlashProtocol>} [opts.protocols]
   */
  constructor (opts = {}) {
    this.storage = opts.persistent === false ? RAM : storage(opts.storage)
    this.store = new Corestore(this.storage)
    this.opts = opts

    this.primaryKey = opts.primaryKey || Slashtag.createKeyPair().publicKey

    this.slashtags = new HashMap()

    this.ready = (async () => {
      this.dht = await DHT.create(this.opts)
      return true
    })()

    this.protocols = this.opts.protocols || protocolsList

    // Gracefully shutdown
    goodbye(() => {
      !this.closed && debug('gracefully closing Slashtags SDK')
      return this.close()
    })
  }

  /**
   *
   * @param {ConstructorParameters<typeof SDK>[0]} opts
   * @returns
   */
  static async init (opts) {
    const sdk = new SDK(opts)
    await sdk.ready

    debug('Slashtags SDK is initiated')
    return sdk
  }

  /**
   * Generates a Slashtag keypair from a name, and the `SDK.primaryKey`.
   *
   * @param {string | Uint8Array} name
   */
  createKeyPair (name) {
    return Slashtag.createKeyPair(this.primaryKey, name)
  }

  /**
   *
   * @param {object} opts
   * @param {string | Uint8Array} [opts.name]
   * @param {Uint8Array} [opts.key]
   * @param {string} [opts.url]
   * @returns {Slashtag}
   */
  slashtag (opts) {
    if (opts.name) {
      // @ts-ignore
      opts.keyPair = this.createKeyPair(opts.name)
    }

    const slashtag = new Slashtag({
      ...opts,
      store: this.store,
      swarmOpts: { relays: this.opts.relays, bootstrap: this.opts.bootstrap },
      protocols: this.protocols
    })

    const existing = this.slashtags.get(slashtag.key)
    if (existing) return existing

    this.slashtags.set(slashtag.key, slashtag)

    slashtag.on('close', () => {
      if (!this.closed) this.slashtags.delete(slashtag.key)
    })

    debug('Created a slashtag ' + slashtag.url)
    return slashtag
  }

  async close () {
    debug('Closing Slashtags SDK')
    if (this.closed) return
    this.closed = true
    for (const slashtag of this.slashtags.values()) {
      await slashtag.close()
    }
    await this.store.close()
    await this.dht.destroy()
    debug('Slashtags SDK closed')
  }
}
