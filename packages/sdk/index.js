import Corestore from 'corestore'
import goodbye from 'graceful-goodbye'
import crypto, { randomBytes, discoveryKey } from 'hypercore-crypto'
import EventEmitter from 'events'
import Hyperswarm from 'hyperswarm'
import Stream from '@hyperswarm/dht-relay/ws'
import Node from '@hyperswarm/dht-relay'
import DHT from '@hyperswarm/dht'
import Slashtag from '@synonymdev/slashtag'
import * as SlashURL from '@synonymdev/slashtags-url'
import Hyperdrive from 'hyperdrive'
import HashMap from 'turbo-hash-map'
import b4a from 'b4a'

import * as constants from './lib/constants.js'
import { defaultStorage } from './lib/storage.js'
import WebSocket from './lib/ws.js'
import { hash, generateSeed } from './lib/crypto.js'

// An ad-hoc topic that 3rd party seeders for many hypercores are supposed
// to join, instead of announcing their IPs on 1000s of topics (for performance)
const SEEDERS_TOPIC = b4a.from('3b9f8ccd062ca9fc0b7dd407b4cd287ca6e2d8b32f046d7958fa7bea4d78fd75', 'hex')

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

    this._relaySocket = typeof opts.relay === 'string' ? new WebSocket(opts.relay) : opts.relay

    this.dht = this._relaySocket
      ? new Node(new Stream(true, this._relaySocket))
      : new DHT({ bootstrap: opts.bootstrap })

    this.swarm = new Hyperswarm({ dht: this.dht, seed: hash(this.primaryKey) })
    this.swarm.on('connection', (socket) => this.corestore.replicate(socket))

    /** Help skip swarm discovery if starting the DHT node failed */
    this.swarm.dht.ready().catch(() => { this.swarm.destroyed = true })

    /** @type {HashMap<Slashtag>} */
    this.slashtags = new HashMap()

    /** @type {HashMap<Hyperdrive>} */
    this._openedDrives = new HashMap()

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
    const corestore = this.corestore.session()

    // Disable _preready to avoid 'Stored core key does not match the provided name' error
    // TODO: temporary hack to fix when slashtag public drive is opened as readonly first!
    if (b4a.equals(this.slashtag().key, key)) {
      return this.slashtag().drivestore.get()
    }

    if (opts.encryptionKey) {
      const preload = this.corestore._preload.bind(this.corestore)
      corestore._preload = _preload.bind(corestore)
      async function _preload (/** @type {any} */ _opts) {
        const { from } = await preload(_opts)
        return { from, encryptionKey: opts.encryptionKey }
      }
    }

    const opened = this._openedDrives.get(key)
    if (opened && !opened.core.closed) return opened

    const drive = new Hyperdrive(corestore, key)
    this._openedDrives.set(key, drive)

    // Announce the drive as a client
    const discovery = this.join(crypto.discoveryKey(key), { server: false, client: true })
    if (discovery) {
      drive.once('close', () => discovery.destroy())
      const done = drive.findingPeers()
      this.swarm.flush().then(done, done)
    }

    // TODO read encrypted drives!
    return drive
  }

  /**
   * @type {import("hyperswarm")['join']}
   * @returns {import('hyperswarm').Discovery | undefined}
   *
   * Returns discovery object or undefined if the swarm is destroyed
   * */
  join (topic, opts = { server: true, client: true }) {
    if (this.destroyed) return
    let discovery = this.swarm.status(topic)

    if (
      !discovery ||
      // reannounce if options changed
      discovery.isServer !== !!opts.server ||
      discovery.isClient !== !!opts.client
    ) {
      discovery = this.swarm.join(topic, opts)
    }
    return discovery
  }

  /** Close corestore and destroy swarm and dht node */
  close () {
    if (this._closing) return this._closing
    this._closing = this._close()
    return this._closing
  }

  /**
   * Helper function to join the seeders topic
   *
   * Returns a promise that resolves as soon as a seeder is discovered
   *
   * 3rd party seeders are conventionally swarming around a well-known topic
   * this function help willing clients to discover seeders through that topic
   * which helps to find hypercores even when their authors are not online,
   * if they upload their cores to a highly available seeeder.
   *
   * @param {boolean} [server=false] If you want to join as a seeder yourself
   * @returns {Promise<import('hyperswarm').PeerInfo>}
   */
  joinSeeders (server = false) {
    this.join(SEEDERS_TOPIC, { server, client: !server })
    return new Promise(resolve => {
      this.swarm.on('connection', (_, peerInfo) => {
        if (SDK.isSeeder(peerInfo)) resolve(peerInfo)
      })
    })
  }

  /**
   * Checks if a peer is announced as a server on the seeders topic
   *
   * @param {import('hyperswarm').PeerInfo} peerInfo
   */
  static isSeeder (peerInfo) {
    return peerInfo.topics.some((topic) => b4a.equals(topic, SEEDERS_TOPIC))
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
