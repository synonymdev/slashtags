import Corestore from 'corestore'
import RAM from 'random-access-memory'
import goodbye from 'graceful-goodbye'
import Debug from 'debug'
import { Slashtag } from '@synonymdev/slashtag'

import { storage } from './storage.js'
import { protocolsList, protocols } from './protocols.js'
import { hash } from './crypto.js'

const debug = Debug('slashtags:sdk')

export class SDK {
  /**
   *
   * @param {object} opts
   * @param {string} [opts.storage]
   * @param {boolean} [opts.persist]
   * @param {Uint8Array} [opts.primaryKey]
   * @param {object} [opts.swarmOpts]
   * @param {string[]} [opts.swarmOpts.relays]
   * @param {import('dht-universal').DHTOpts['bootstrap']} [opts.swarmOpts.bootstrap]
   * @param {Array<typeof import('@synonymdev/slashtag').SlashProtocol>} [opts.protocols]
   */
  constructor (opts = {}) {
    this._opts = opts
    this._protocols = opts.protocols || protocolsList

    this.storage =
      opts.persist === false
        ? RAM
        : !opts.storage || typeof opts.storage === 'string'
            ? storage(opts.storage)
            : opts.storage
    this.primaryKey = opts.primaryKey || Slashtag.createKeyPair().publicKey

    this.slashtags = new Map()

    this.store = new Corestore(this.storage, {
      primaryKey: hash(this.primaryKey)
    })

    this._root = new Slashtag({
      keyPair: this.createKeyPair(),
      swarmOpts: opts.swarmOpts || {},
      protocols: this._protocols,
      store: this.store
    })

    this.slashtags.set(this._root.url.slashtag.toString(), this._root)

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
   * @param {string | Uint8Array} [name]
   */
  createKeyPair (name) {
    return Slashtag.createKeyPair(this.primaryKey, name)
  }

  /**
   *
   * @param {object} [opts]
   * @param {string | Uint8Array} [opts.name]
   * @param {Uint8Array} [opts.key]
   * @param {string } [opts.url]
   * @returns {Slashtag}
   */
  slashtag (opts) {
    if (opts?.name) {
      // @ts-ignore
      opts.keyPair = this.createKeyPair(opts.name)
    } else if (!opts?.key && !opts?.url) {
      return this._root
    }

    const slashtag = new Slashtag({
      ...opts,
      store: this.store,
      swarmOpts: {
        ...this._opts.swarmOpts
      },
      protocols: this._protocols,
      swarm: this._root.swarm
    })

    const existing = this.slashtags.get(slashtag.url.slashtag.toString())
    if (existing) return existing

    // Opening remote Slashtags doesn't involve expensive IO operations.
    // No need to keep it in memory.
    if (slashtag.remote) return slashtag

    this.slashtags.set(slashtag.url.slashtag.toString(), slashtag)

    slashtag.on('close', () => {
      if (!this.closed) this.slashtags.delete(slashtag.url.slashtag.toString())
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

  static get DERIVATION_PATH () {
    return "m/123456'"
  }
}
