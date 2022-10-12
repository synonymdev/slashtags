import Corestore from 'corestore'
import RAM from 'random-access-memory'
import EventEmitter from 'events'
import DHT from '@hyperswarm/dht'
import HashMap from 'turbo-hash-map'
import Drivestore from '@synonymdev/slashdrive'
import { format, encode, parse, decode } from '@synonymdev/slashtags-url'

// @ts-ignore
export class Slashtag extends EventEmitter {
  /**
   * @param {object} [opts]
   * @param {import('corestore')} [opts.corestore]
   * @param {import('@hyperswarm/dht')} [opts.dht]
   * @param {import('@hyperswarm/dht').KeyPair} [opts.keyPair]
   * @param {import('@hyperswarm/dht').Node[]} [opts.bootstrap]
   */
  constructor (opts = {}) {
    super()
    this.keyPair = opts.keyPair || DHT.keyPair()
    this.key = this.keyPair.publicKey

    this.id = encode(this.key)
    this.url = format(this.key)

    this.dht =
      opts.dht || new DHT({ bootstrap: opts?.bootstrap, keyPair: this.keyPair })

    this.server = this.dht.createServer(this._handleConnection.bind(this))
    /** @type {HashMap<SecretStream>} */
    this.sockets = new HashMap()

    this.drivestore = new Drivestore(opts?.corestore || new Corestore(RAM), this.keyPair)

    /** @type {Emitter['on']} */ this.on = super.on
    /** @type {Emitter['on']} */ this.once = super.once
    /** @type {Emitter['on']} */ this.off = super.off
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
    await this.unlisten()
    for (const socket of this.sockets.values()) {
      await socket.destroy()
    }

    this.dht.defaultKeyPair === this.keyPair && (await this.dht.destroy())

    this.closed = true
    this.emit('close')
  }

  /**
   * @param {SecretStream} socket
   */
  _handleConnection (socket) {
    this.drivestore.replicate(socket)

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

function noop () {}

/**
 * @typedef {import('./lib/interfaces').Emitter} Emitter
 * @typedef {import('@hyperswarm/secret-stream')} SecretStream
 */

export default Slashtag
