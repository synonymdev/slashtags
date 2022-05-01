import EventEmitter from 'events'
import { DHT } from 'dht-universal'
import Hyperswarm from 'hyperswarm'
import b4a from 'b4a'
import Corestore from 'corestore'
import RAM from 'random-access-memory'
import { SlashDrive } from '@synonymdev/slashdrive'
import Debug from 'debug'

import { SlashtagProtocol } from './protocol.js'
import { randomBytes, createKeyPair } from './crypto.js'
import { catchConnection } from './utils.js'

export { SlashtagProtocol }

export const DRIVE_KEYS = {
  profile: 'profile.json'
}

const debug = Debug('slashtags:slashtag')

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

    const dht = await DHT.create({ ...this._swarmOpts })
    this.swarm = new Hyperswarm({
      ...this._swarmOpts,
      keyPair: this.keyPair,
      dht
    })
    this.swarm.on('connection', this._handleConnection.bind(this))

    this.publicDrive = new SlashDrive({
      store: this.store,
      key: this.key,
      keyPair: this.keyPair
    })
    await this.publicDrive.ready()

    // Discovery
    // TODO enable customizing the discovery options
    const discovery = this.swarm.join(this.publicDrive.discoveryKey)
    if (this.remote) {
      const done = await this.publicDrive.findingPeers()
      debug('discovery', this.publicDrive.discoveryKey, done)
      this.swarm.flush().then(done, done)
    } else {
      await discovery.flushed()
    }

    this._ready = true
    debug('Slashtag is ready', {
      key: b4a.toString(this.key, 'hex'),
      remote: this.remote
    })
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

  /**
   * Sets the Slashtag's profile in its public drive
   *
   * @param {Object} profile
   */
  async setProfile (profile) {
    await this.ready()
    return this.publicDrive?.put(
      DRIVE_KEYS.profile,
      b4a.from(JSON.stringify(profile))
    )
  }

  async getProfile () {
    await this.ready()
    const result = await this.publicDrive?.get(DRIVE_KEYS.profile)
    if (!result) return null
    return JSON.parse(b4a.toString(result))
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
    if (!this._protocols) return
    for (const protocol of this._protocols.values()) {
      protocol.createChannel(socket, peerInfo)
    }
  }
}

/**
 * @typedef {import('./interfaces').PeerInfo } PeerInfo
 * @typedef {import('./interfaces').SecretStream } SecretStream
 */
