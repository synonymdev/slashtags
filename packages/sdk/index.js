const Corestore = require('corestore')
const goodbye = require('graceful-goodbye')
const crypto = require('hypercore-crypto')
const EventEmitter = require('events')
const Hyperswarm = require('hyperswarm')
const Stream = require('@hyperswarm/dht-relay/ws')
const RelayedDHT = require('@hyperswarm/dht-relay')
const DHT = require('hyperdht')
const Slashtag = require('@synonymdev/slashtag')
const SlashURL = require('@synonymdev/slashtags-url')
const Hyperdrive = require('hyperdrive')
const HashMap = require('turbo-hash-map')
const b4a = require('b4a')

const constants = require('./lib/constants.js')
const { defaultStorage } = require('./lib/storage.js')
const WebSocket = require('./lib/ws.js')
const { hash, generateSeed } = require('./lib/crypto.js')

const { randomBytes, discoveryKey } = crypto

// An ad-hoc topic that 3rd party seeders for many hypercores are supposed
// to join, instead of announcing their IPs on 1000s of topics (for performance)
const SEEDERS_TOPIC = b4a.from('3b9f8ccd062ca9fc0b7dd407b4cd287ca6e2d8b32f046d7958fa7bea4d78fd75', 'hex')

class SDK extends EventEmitter {
  /**
   *
   * @param {object} opts
   * @param {any} [opts.storage]
   * @param {Uint8Array} [opts.primaryKey]
   * @param {string | WebSocket} [opts.relay]
   * @param {import('hyperdht').Node[]} [opts.bootstrap]
   * @param {Uint8Array[]} [opts.seeders]
   */
  constructor (opts = {}) {
    super()

    this.storage = opts.storage || defaultStorage
    this.primaryKey = opts.primaryKey || randomBytes(32)

    this.corestore = new Corestore(this.storage)

    this._relaySocket = typeof opts.relay === 'string' ? new WebSocket(opts.relay) : opts.relay

    this.dht = this._relaySocket
      ? new RelayedDHT(new Stream(true, this._relaySocket))
      : new DHT({ bootstrap: opts.bootstrap })

    // Disable this.dht.destroy inside Slashtag instance to avoid destroying the DHT node when calling slashtag.close()
    // as the DHT node is shared between all slashtag instances.
    // TODO: remove this once hyperswarm sessions is merged https://github.com/holepunchto/hyperswarm/pull/130
    this._destroyDHT = this.dht.destroy.bind(this.dht)
    // @ts-ignore
    this.dht.destroy = noop

    // @deprecated
    this.swarm = new Hyperswarm({ dht: this.dht, seed: hash(this.primaryKey) })
    this.swarm.on('connection', (socket) => this.corestore.replicate(socket))

    /** Help skip swarm discovery if starting the DHT node failed */
    this.swarm.dht.ready().catch(() => { this.swarm.destroyed = true })
    // TODO: remove this.swarm once everywhere is using slashtag.coreData instead

    /** @type {HashMap<Slashtag>} */
    this.slashtags = new HashMap()

    this._seeders = opts.seeders

    // Gracefully shutdown
    goodbye(this.close.bind(this))
  }

  async ready () {
    await this.corestore.ready()
    return this.swarm.dht.ready()
  }

  // TODO: check if Bitkit still needs closed and destroyed getters
  /**
   * Corestore is closed
   * cannot create new writable or readable drives
   */
  get closed () {
    return this.corestore.closing || this._closing
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
   * Generates a Slashtag keypair = require(a `name`, and the internal `primaryKey`.
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
      dht: this.dht,
      seeders: this._seeders
    })

    this.slashtags.set(key, slashtag)
    slashtag.once('close', () => this.slashtags.delete(key))

    this.join(discoveryKey(key))

    return slashtag
  }

  /**
   * Creates a Hyperdrive and announce the SDK's swarm as a client looking up for peers for it.
   *
   * @deprecated use `slashtag.coreData` or `slashtag.profile` instead
   *
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

    const drive = new Hyperdrive(corestore, key)

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
   * Returns discovery object or undefined if the swarm is destroyed
   *
   * @deprecated use `slashtag.coreData` which will join the right topics automatically
   *
   * @type {import("hyperswarm")['join']}
   * @returns {import('hyperswarm').Discovery | undefined}
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
   * @deprecated use `slashtag.coreData` which will join the seeders topic on your behalf.
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
   * @deprecated no need to use isSeeder anymore, use `slashtag.coreData` which will manage seeeders on your behalf
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

    // @ts-ignore
    await this._destroyDHT()

    this.emit('close')
  }
}

function noop () { }

module.exports = SDK
module.exports.constants = constants
module.exports.SlashURL = SlashURL
module.exports.Slashtag = Slashtag
module.exports.Hyperdrive = Hyperdrive
