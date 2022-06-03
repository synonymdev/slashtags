import Corestore from 'corestore'
import RAM from 'random-access-memory'
import goodbye from 'graceful-goodbye'
import HashMap from 'turbo-hash-map'
import Debug from 'debug'
import { Slashtag } from '@synonymdev/slashtag'

import { storage } from './storage.js'
import { protocolsList, protocols } from './protocols.js'
import { hash } from './crypto.js'

const debug = Debug('slashtags:sdk')

const ROOT_SLASHTAG_NAME = '@slashtags-sdk/root'
const WELLKNOWN_PATH = '/.well-known/slashtags'
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

    this.storage = opts.persist === false ? RAM : storage(opts.storage)
    this.primaryKey = opts.primaryKey || Slashtag.createKeyPair().publicKey

    this.slashtags = new HashMap()

    const store = new Corestore(this.storage, {
      primaryKey: hash(this.primaryKey)
    })

    this._root = new Slashtag({
      keyPair: this.createKeyPair(ROOT_SLASHTAG_NAME),
      swarmOpts: opts.swarmOpts || {},
      protocols: this._protocols,
      store
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
      swarm: this._root.swarm
    })

    const existing = this.slashtags.get(slashtag.key)
    if (existing) return existing

    // Opening remote Slashtags doesn't involve expensive IO operations.
    // No need to keep it in memory.
    if (slashtag.remote) return slashtag

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

  static get DERIVATION_PATH () {
    return "m/123456'"
  }

  /**
   *
   * @param {string} address
   * @param {object} [opts]
   * @param {string} [opts.protocol]
   * @param {import ('node-fetch').default} [opts.fetch]
   * @returns {Promise<Slashtag | null>}
   */
  async fromDNS (address, opts) {
    const split = address.split('@')
    const domain = split.pop()
    const name = split.pop() || '_'

    const _fetch = opts?.fetch || fetch

    const response = await _fetch(
      (opts?.protocol || 'https://') +
        domain +
        WELLKNOWN_PATH +
        '?name=' +
        name
    )
    const names = await response.json()
    const url = names[name]

    if (!url) return null

    return this.slashtag({ url })
  }
}
