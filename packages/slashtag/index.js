import Hyperswarm from 'hyperswarm'
import { keyPair } from 'hypercore-crypto'
import Corestore from 'corestore'
import RAM from 'random-access-memory'
import { format, encode, parse, decode } from '@synonymdev/slashtags-url'
import EventEmitter from 'events'
import HyperDrive from 'hyperdrive'
import Protomux from 'protomux'

// @ts-ignore
export class Slashtag extends EventEmitter {
  /**
   *
   * @param {object} [opts]
   * @param {import('@hyperswarm/dht').KeyPair} [opts.keyPair]
   * @param {import('@hyperswarm/dht').Node[]} [opts.bootstrap]
   * @param {import('hyperswarm')} [opts._swarm]
   */
  constructor (opts = {}) {
    super()
    this.keyPair = opts.keyPair || keyPair()
    this.key = this.keyPair.publicKey

    this.id = encode(this.key)
    this.url = format(this.key)

    /** Hyperswarm used for Discovery without exposing Slashtag keypair */
    this._shouldDestroyDiscoverySwarm = !opts._swarm
    this.discoverySwarm =
      opts._swarm || new Hyperswarm({ bootstrap: opts.bootstrap })
    this.discoverySwarm.on('connection', this._handleConnection.bind(this))

    /** Hyperswarm used for direct deliberate connections to a Slashtag */
    this.swarm = new Hyperswarm({
      dht: this.discoverySwarm.dht,
      keyPair: this.keyPair
    })
    this.swarm.on('connection', this._handleConnection.bind(this))

    this.corestore = new Corestore(RAM)
    /** @type {Hypercore} */
    this.core = this.corestore.get({ keyPair: this.keyPair })

    this.opening = this._open()
    this.opening.catch(noop)
    this.opened = false
    this.closed = false

    /** @type {Emitter['on']} */ this.on = super.on
    /** @type {Emitter['on']} */ this.once = super.once
    /** @type {Emitter['on']} */ this.off = super.off
  }

  async _open () {
    await this.core.ready()
    await this.join(this.core).flushed()

    this.opened = true
    this.emit('ready')
  }

  async ready () {
    await this.opening
  }

  listen () {
    return this.swarm.listen()
  }

  /**
   * Connect to a remote Slashtag.
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

    this.swarm.joinPeer(_key)
    return this.swarm._allConnections.get(_key)
  }

  /**
   * Discover peers for a Hypercore, Hyperdrive, or a random topic.
   * @param {HypercoreLike | Uint8Array} core
   * @param {Parameters<import('hyperswarm')['join']>[1]} [opts]
   */
  join (core, opts) {
    /** @type {HypercoreLike} */ // @ts-ignore
    const _core = core.discoveryKey ? core : { discoveryKey: core }
    const done = _core.findingPeers?.()

    if (done) this.discoverySwarm.flush().then(done, done)

    return this.discoverySwarm.join(_core.discoveryKey, opts)
  }

  // /** @param {string} name */
  // drive (name) {
  //   const ns = this.corestore.namespace('drive::' + name)
  //   const encryptionKey = hash(ns._namespace)
  //   const drive = new HyperDrive(ns, { encryptionKey })

  //   drive.ready().then(() => this.join(drive))

  //   return drive
  // }

  close () {
    if (this._closing) return this._closing
    this._closing = this._close()

    this.removeAllListeners()
    return this._closing
  }

  async _close () {
    await this.corestore.close()

    this._shouldDestroyDiscoverySwarm
      ? await this.discoverySwarm.destroy()
      : // @ts-ignore Avoid destroying the DHT node.
        (this.swarm.dht = { destroy: noop })
    await this.swarm.destroy()

    this.closed = true
    this.emit('close')
  }

  /** @param {SecretStream} socket */
  _handleConnection (socket) {
    socket.remoteSlashtag = remoteSlashtag(socket.remotePublicKey)

    this.corestore.replicate(socket)

    this.emit('connection', socket, socket.remoteSlashtag)
  }
}

/** @param {Uint8Array} publicKey */
function remoteSlashtag (publicKey) {
  return { publicKey, id: encode(publicKey), url: format(publicKey) }
}

function noop () {}

/**
 * @typedef {import('./lib/interfaces').SecretStream } SecretStream
 * @typedef {import('./lib/interfaces').Emitter} Emitter
 * @typedef {import('./lib/interfaces').HypercoreLike} HypercoreLike
 * @typedef {import('hypercore')} Hypercore
 */

export default Slashtag
