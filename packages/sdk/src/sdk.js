import Corestore from 'corestore'
import RAM from 'random-access-memory'
import goodbye from 'graceful-goodbye'
import HashMap from 'turbo-hash-map'
import Debug from 'debug'
import { Slashtag } from '@synonymdev/slashtag'

import { storage } from './storage.js'
import { protocolsList, protocols } from './protocols.js'

const debug = Debug('slashtags:sdk')

const ROOT_SLASHTAG_NAME = '@slashtags-sdk/root'
export class SDK {
  /**
   *
   * @param {object} opts
   * @param {string} [opts.storage]
   * @param {boolean} [opts.persistent]
   * @param {Uint8Array} [opts.primaryKey]
   * @param {object} [opts.swarmOpts]
   * @param {string[]} [opts.swarmOpts.relays]
   * @param {import('dht-universal').DHTOpts['bootstrap']} [opts.swarmOpts.bootstrap]
   * @param {Array<typeof import('@synonymdev/slashtag').SlashProtocol>} [opts.protocols]
   */
  constructor (opts = {}) {
    this._opts = opts
    this._protocols = opts.protocols || protocolsList

    this.storage = opts.persistent === false ? RAM : storage(opts.storage)
    this.primaryKey = opts.primaryKey || Slashtag.createKeyPair().publicKey

    this.slashtags = new HashMap()

    this._root = new Slashtag({
      keyPair: this.createKeyPair(ROOT_SLASHTAG_NAME),
      swarmOpts: opts.swarmOpts || {},
      protocols: this._protocols,
      store: new Corestore(this.storage)
    })

    // Gracefully shutdown
    goodbye(() => {
      !this.closed && debug('gracefully closing Slashtags SDK')
      return this.close()
    })
  }

  async ready () {
    if (this._ready) return
    this._ready = true
    await this._root.ready()
  }

  /**
   *
   * @param {ConstructorParameters<typeof SDK>[0]} opts
   * @returns
   */
  static async init (opts) {
    const sdk = new SDK(opts)
    await sdk.ready()

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
      store: this._root.store,
      swarmOpts: {
        ...this._opts.swarmOpts
      },
      protocols: this._protocols,
      swarm: this._root.swarm,
      _createRemoteSlashtag: (key) => this.slashtag.bind(this)({ key })
    })

    const existing = this.slashtags.get(slashtag.key)
    if (existing) return existing

    this.slashtags.set(slashtag.key, slashtag)

    slashtag.on('close', () => {
      if (!this.closed) this.slashtags.delete(slashtag.key)
    })

    debug('Created a slashtag ' + slashtag.url, { remote: slashtag.remote })
    return slashtag
  }

  async close () {
    debug('Closing Slashtags SDK')
    if (this.closed) return
    this.closed = true
    for (const slashtag of this.slashtags.values()) {
      await slashtag.close()
    }
    await this._root.close()
    debug('Slashtags SDK closed')
  }

  static get protocols () {
    return protocols
  }
}
