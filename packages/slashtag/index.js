const EventEmitter = require('events')
const DHT = require('hyperdht')
const HashMap = require('turbo-hash-map')
const Drivestore = require('@synonymdev/slashdrive')
const { format, encode, parse, decode } = require('@synonymdev/slashtags-url')
const Hyperswarm = require('hyperswarm')
const SlashtagsProfile = require('@synonymdev/slashtags-profile')
const SlashtagsCoreData = require('@synonymdev/slashtags-core-data')

// @ts-ignore
class Slashtag extends EventEmitter {
  /**
   * @param {object} [opts]
   * @param {import('corestore')} [opts.corestore]
   * @param {import('hyperdht')} [opts.dht]
   * @param {import('hyperdht').KeyPair} [opts.keyPair]
   * @param {import('hyperdht').Node[]} [opts.bootstrap]
   * @param {Uint8Array[]} [opts.seeders]
   */
  constructor (opts = {}) {
    super()
    this.keyPair = opts.keyPair || DHT.keyPair()
    this.key = this.keyPair.publicKey

    this.id = encode(this.key)
    this.url = format(this.key)

    this.swarm = new Hyperswarm({ dht: opts.dht, bootstrap: opts.bootstrap })
    this.dht = this.swarm.dht
    this.server = this.swarm.dht.createServer(this._handleConnection.bind(this))
    /** @type {HashMap<SecretStream>} */
    this.sockets = new HashMap()

    this.coreData = new SlashtagsCoreData({
      keyPair: this.keyPair,
      corestore: opts.corestore,
      swarm: this.swarm,
      seeders: opts.seeders
    })
    this.profile = new SlashtagsProfile(this.coreData)

    // @deprecated use `slashtag.coreData` instead.
    this.drivestore = new Drivestore(this.coreData)

    /** @type {Emitter['on']} */ this.on = super.on
    /** @type {Emitter['on']} */ this.once = super.once
    /** @type {Emitter['on']} */ this.off = super.off
  }

  /**
   * Await for internal resourcest to be ready.
   *
   * @returns {Promise<void>}
   */
  ready () {
    return this.coreData.ready()
  }

  /** Listen for incoming connections on Slashtag's KeyPair */
  listen () {
    if (!this.listening) this.listening = this.server.listen(this.keyPair)
    return this.listening
  }

  /** Stop listening for incoming connections on Slashtag's KeyPair */
  unlisten () {
    this.listening = false
    return this.server.close()
  }

  /**
   * Connect to a remote Slashtag by its key, z-base-32 id, or `slash:` url.
   *
   * @deprecated use `slashtags.swarm` with `slashtags-rpc` instead.
   *
   * @param {Uint8Array | string} key
   * @returns {SecretStream}
   */
  connect (key) {
    /** @type {Uint8Array} */
    const _key =
      typeof key === 'string'
        ? key.startsWith('slash')
          ? parse(key).key
          : decode(key)
        : key

    const existing = this.sockets.get(_key)
    if (existing) return existing

    const socket = this.dht.connect(_key, { keyPair: this.keyPair })
    return this._handleConnection(socket)
  }

  close () {
    if (this._closing) return this._closing
    this._closing = this._close()
    return this._closing
  }

  async _close () {
    for (const socket of this.sockets.values()) {
      await socket.destroy()
    }

    await this.coreData.close({ force: true })
    await this.swarm.destroy()

    this.listening = false

    this.closed = true
    this.emit('close')
  }

  /**
   * Handle direct connections to a server listening on this slashtag keypair
   *
   * @param {SecretStream} socket
   */
  _handleConnection (socket) {
    // TODO: remove drivestore after coreData is used everywhere instead
    this.drivestore.replicate(socket)

    this.coreData._corestoreSession.replicate(socket)

    socket.on('error', noop)
    socket.on('close', () => {
      this.sockets.delete(socket.remotePublicKey)
    })
    socket.once('open', () => {
      socket.removeListener('error', noop)
    })

    this.sockets.set(socket.remotePublicKey, socket)
    this.emit('connection', socket)

    // @ts-ignore
    return socket
  }
}

function noop () { }

/**
 * @typedef {import('./lib/interfaces').Emitter} Emitter
 * @typedef {import('@hyperswarm/secret-stream')} SecretStream
 */

module.exports = Slashtag
