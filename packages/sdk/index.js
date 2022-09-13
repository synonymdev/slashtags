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
import HyperDrive from 'hyperdrive'
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
   * @param {string} [opts.relay]
   * @param {import('@hyperswarm/dht').Node[]} [opts.bootstrap]
   */
  constructor (opts = {}) {
    super()

    this.storage = opts.storage || defaultStorage
    this.primaryKey = opts.primaryKey || randomBytes(32)

    this.corestore = new Corestore(this.storage, { primaryKey: this.primaryKey })

    this.dht = opts?.relay
      ? new Node(new Stream(true, new WebSocket(opts.relay)))
      : new DHT({ bootstrap: opts.bootstrap })

    this.swarm = new Hyperswarm({ dht: this.dht })
    this.swarm.on('connection', (socket) => this.corestore.replicate(socket))

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
   * Generates a Slashtag keypair from a `name`, and the internal `primaryKey`.
   * @param {string} [name]
   */
  createKeyPair (name) {
    return crypto.keyPair(generateSeed(this.primaryKey, name))
  }

  /**
   * Creates a Slashtag by name.
   * @param {string} [name] utf8 encoded string
   */
  slashtag (name) {
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
   */
  drive (key) {
    // TODO read encrypted drives!
    const drive = new HyperDrive(this.corestore, key)
    this.join(crypto.discoveryKey(key), { server: false, client: true })
    return drive
  }

  /** @type {import("hyperswarm")['join']} */
  join (topic, opts = {}) {
    const discovery = this.swarm.join(topic, opts)
    const done = this.corestore.findingPeers()
    this.swarm.flush().then(done, done)
    return discovery
  }

  close () {
    if (this._closing) return this._closing
    this._closing = this._close()
    return this._closing
  }

  async _close () {
    await Promise.all([...this.slashtags.values()].map(s => s.close()))

    await this.swarm.destroy()

    this.closed = true
    this.emit('close')
  }
}

export default SDK

export {
  constants,
  SlashURL,
  Slashtag
}
