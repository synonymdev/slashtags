import EventEmitter from 'events'
import { DHT } from 'dht-universal'
import Hyperswarm from 'hyperswarm'
import b4a from 'b4a'
import { SlashtagProtocol } from './protocol.js'
import Corestore from 'corestore'
import RAM from 'random-access-memory'
// import Debug from 'debug';

import { randomBytes, createKeyPair } from './crypto.js'
import { catchConnection } from './utils.js'

export { SlashtagProtocol }

// const debug = Debug('slashtags:slashtag');

export class Slashtag extends EventEmitter {
  /**
   *
   * @param {object} opts
   * @param {Uint8Array} [opts.key]
   * @param {import('./interfaces').KeyPair} [opts.keyPair]
   * @param {import('corestore')} [opts.store]
   * @param {Array<typeof import('./protocol').SlashtagProtocol>} [opts.protocols]
   * @param {object} [opts.swarmOpts]
   * @param {string[]} [opts.swarmOpts.relays]
   * @param {Array<{host: string; port: number}>} [opts.swarmOpts.bootstrap]
   */
  constructor (opts = {}) {
    super()

    this.keyPair = opts.keyPair
    this.remote = !this.keyPair
    this.key = opts.keyPair?.publicKey || opts.key

    if (!this.key) throw new Error('Missing keyPair or key')

    this._swarmOpts = opts.swarmOpts
    const store = opts.store || new Corestore(RAM)
    this.store = store.namespace(this.key)

    if (!this.remote) {
      this._protocols = new Map()
      opts.protocols?.forEach((p) => this.protocol(p))
    }
  }

  async ready () {
    if (this._ready) return true

    if (!this.remote) {
      const dht = await DHT.create({ ...this._swarmOpts })
      this.swarm = new Hyperswarm({
        ...this._swarmOpts,
        keyPair: this.keyPair,
        dht
      })
      this.swarm.on('connection', this._handleConnection.bind(this))
    }

    this._ready = true
  }

  async listen () {
    if (this.remote) throw new Error('Cannot listen on a remote slashtag')
    await this.ready()

    // @ts-ignore After the ready() call, this.swarm is set
    return this.swarm.listen()
  }

  /**
   * Connect to a remote Slashtag.
   *
   * @param {Uint8Array} key
   * @returns {Promise<{connection: SecretStream, peerInfo:PeerInfo}>}
   */
  async connect (key) {
    if (this.remote) throw new Error('Cannot connect from a remote slashtag')
    if (b4a.equals(key, this.key)) throw new Error('Cannot connect to self')
    await this.ready()

    let connection = this.swarm?._allConnections.get(key)
    if (connection) {
      return {
        connection,
        peerInfo: this.swarm?.peers.get(b4a.toString(key, 'hex'))
      }
    }

    connection = this.swarm && catchConnection(this.swarm, key)

    this.swarm?.joinPeer(key)
    return connection
  }

  /**
   * Registers a protocol if it wasn't already, and get and instance of it for this Slashtag.
   *
   * @template {typeof SlashtagProtocol} P
   * @param {P} Protocol
   * @returns {InstanceType<P>}
   */
  protocol (Protocol) {
    if (this.remote) {
      throw new Error('Cannot register protocol on a remote slashtag')
    }

    // @ts-ignore
    const name = Protocol.protocol

    let protocol = this._protocols?.get(name)
    if (protocol) return protocol
    protocol = new Protocol({ slashtag: this })
    this._protocols?.set(name, protocol)
    return protocol
  }

  async close () {
    await this.ready()
    await this.swarm?.destroy()
    await this.store.close()
    this.emit('close')
  }

  /**
   * Generates a Slashtags KeyPair, randomly or optionally from primary key and a name.
   *
   * @param {Uint8Array} [primaryKey]
   * @param {string} [name]
   */
  static createKeyPair (primaryKey = randomBytes(), name = '') {
    return createKeyPair(primaryKey, name)
  }

  /**
   * Augment Server and client's connections with Slashtag protocols and peerInfo.slashtag.
   *
   * @param {*} socket
   * @param {PeerInfo} peerInfo
   */
  async _handleConnection (socket, peerInfo) {
    this.store.replicate(socket)
    peerInfo.slashtag = new Slashtag({ key: peerInfo.publicKey })

    // const info = { local: this.url, remote: peerInfo.slashtag.url };

    // debug('Swarm connection OPENED', info);
    // socket.on('error', function (err) {
    // debug('Swarm connection ERRORED', err, info);
    // });
    // socket.on('close', function () {
    // debug('Swarm connection CLOSED', info);
    // });

    this._setupProtocols(socket, peerInfo)
    this.emit('connection', socket, peerInfo)
  }

  /**
   *
   * @param {SecretStream} socket
   * @param {PeerInfo} peerInfo
   */
  _setupProtocols (socket, peerInfo) {
    // @ts-ignore
    for (const protocol of this._protocols.values()) {
      protocol.createChannel(socket, peerInfo)
    }
  }
}

/**
 * @typedef {import('./interfaces').PeerInfo } PeerInfo
 * @typedef {import('./interfaces').SecretStream } SecretStream
 */
