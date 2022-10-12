import Corestore from 'corestore'
import goodbye from 'graceful-goodbye'
import crypto, { randomBytes, discoveryKey } from 'hypercore-crypto'
import EventEmitter from 'events'
import Hyperswarm from 'hyperswarm'
import Stream from '@hyperswarm/dht-relay/ws'
import Node from '@hyperswarm/dht-relay'
import WebSocket from 'ws'
import DHT from '@hyperswarm/dht'
import Slashtag from '@synonymdev/slashtag'
import * as SlashURL from '@synonymdev/slashtags-url'
import Hyperdrive from 'hyperdrive'
import HashMap from 'turbo-hash-map'

import * as constants from './lib/constants.js'
import { defaultStorage } from './lib/storage.js'
import { generateSeed } from './lib/crypto.js'

export class SDK extends EventEmitter {
  /**
   *
   * @param {object} opts
   * @param {any} [opts.storage]
   * @param {Uint8Array} [opts.primaryKey]
   * @param {string | WebSocket} [opts.relay]
   * @param {import('@hyperswarm/dht').Node[]} [opts.bootstrap]
   */
  constructor (opts = {}) {
    super()

    this.storage = opts.storage || defaultStorage
    this.primaryKey = opts.primaryKey || randomBytes(32)

    this.corestore = new Corestore(this.storage)
    // Disable _preready to avoid 'Stored core key does not match the provided name' error
    this.corestore._preready = noop

    this._relaySocket = typeof opts.relay === 'string' ? new WebSocket(opts.relay) : opts.relay

    this.dht = this._relaySocket
      ? new Node(new Stream(true, this._relaySocket))
      : new DHT({ bootstrap: opts.bootstrap })

    this.swarm = new Hyperswarm({ dht: this.dht })
    this.swarm.on('connection', (socket) => this.corestore.replicate(socket))

    /** Help skip swarm discovery if starting the DHT node failed */
    this.swarm.dht.ready().catch(() => { this.swarm.destroyed = true })

    /** @type {HashMap<Slashtag>} */
    this.slashtags = new HashMap()

    // Gracefully shutdown
    goodbye(this.close.bind(this))
  }

  async ready () {
    await this.corestore.ready()
    return this.swarm.dht.ready()
  }

  /**
   * Corestore is closed
   * cannot create new writable or readable drives
   */
  get closed () {
    return this.corestore._closing || this._closing
  }

  /**
   * Swarm destroyed
   * cannot join, announce or lookup any drives on the DHT
   */
  get destroyed () {
    const relayClosed = this._relaySocket && this._relaySocket.readyState > 1
    return this.swarm.destroyed || relayClosed
  }

  /**
   * Generates a Slashtag keypair from a `name`, and the internal `primaryKey`.
   * @param {string} [name]
   */
  createKeyPair (name) {
    return crypto.keyPair(generateSeed(this.primaryKey, name))
  }

  /**
   * Creates a Slashtag by name.
   * @param {string} [name] utf8 encoded string
   * @throws {Error} throws an error if the SDK or its corestore is closing
   */
  slashtag (name) {
    if (this.closed) throw new Error('SDK is closed')
    const key = this.createKeyPair(name).publicKey
    const existing = this.slashtags.get(key)
    if (existing) return existing

    const slashtag = new Slashtag({
      keyPair: this.createKeyPair(name),
      corestore: this.corestore,
      dht: this.dht
    })

    this.slashtags.set(key, slashtag)
    slashtag.once('close', () => this.slashtags.delete(key))

    this.join(discoveryKey(key))

    return slashtag
  }

  /**
   * Creates a Hyperdrive and announce the SDK's swarm as a client looking up for peers for it.
   * @param {Uint8Array} key
   * @param {object} [opts]
   * @param {Uint8Array} [opts.encryptionKey]
   * @throws {Error} throws an error if the SDK or its corestore is closing
   */
  drive (key, opts = {}) {
    if (this.closed) throw new Error('SDK is closed')

    // Temporary solution to handle encrypted hyperdrives!
    // TODO: remove this once Hyperdrive next accept encryption keys
    const corestore = opts.encryptionKey ? this.corestore.session() : this.corestore
    if (opts.encryptionKey) {
      const preload = this.corestore._preload.bind(this.corestore)
      corestore._preload = _preload.bind(corestore)
      async function _preload (/** @type {any} */ _opts) {
        const { from } = await preload(_opts)
        return { from, encryptionKey: opts.encryptionKey }
      }
    }

    const drive = new Hyperdrive(corestore, key)

    // Announce the drive as a client
    const discovery = this.join(crypto.discoveryKey(key), { server: false, client: true })
    drive.on('close', () => discovery?.destroy())

    // TODO read encrypted drives!
    return drive
  }

  /**
   * @type {import("hyperswarm")['join']}
   * @returns {import('hyperswarm').Discovery | undefined}
   *
   * Returns discovery object or undefined if the swarm is destroyed
   * */
  join (topic, opts = {}) {
    if (this.destroyed) return
    const discovery = this.swarm.join(topic, opts)
    const done = this.corestore.findingPeers()
    this.swarm.flush().then(done, done)
    return discovery
  }

  /** Close corestore and destroy swarm and dht node */
  close () {
    if (this._closing) return this._closing
    this._closing = this._close()
    return this._closing
  }

  async _close () {
    await Promise.all([...this.slashtags.values()].map(s => s.close()))

    await Promise.all([
      this.corestore.close(),
      this.swarm.destroy()
    ])

    this.emit('close')
  }
}

export default SDK

export {
  constants,
  SlashURL,
  Slashtag,
  Hyperdrive
}

function noop () {}
