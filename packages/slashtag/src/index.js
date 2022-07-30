import EventEmitter from 'events'
import { DHT } from 'dht-universal'
import { DHT as Relayed } from 'dht-universal/relay.js'
import Hyperswarm from 'hyperswarm'
import b4a from 'b4a'
import Corestore from 'corestore'
import RAM from 'random-access-memory'
import goodbye from 'graceful-goodbye'
import { SlashDrive } from '@synonymdev/slashdrive'
import Debug from 'debug'
import { SlashURL } from './url.js'

import { SlashProtocol } from './protocol.js'
import { randomBytes, createKeyPair } from './crypto.js'
import { catchConnection } from './utils.js'

export { SlashProtocol, SlashURL }

export const DRIVE_KEYS = {
  profile: 'profile.json'
}

const debug = Debug('slashtags:slashtag')
const swarmDebug = Debug('slashtags:slashtag:swarm')

export class Slashtag extends EventEmitter {
  /**
   *
   * @param {object} opts
   * @param {string} [opts.url]
   * @param {Uint8Array} [opts.key]
   * @param {import('./interfaces').KeyPair} [opts.keyPair]
   * @param {import('corestore')} [opts.store]
   * @param {import('hyperswarm')} [opts.swarm]
   * @param {object} [opts.swarmOpts]
   * @param {string[]} [opts.swarmOpts.relays]
   * @param {Array<{host: string; port: number}>} [opts.swarmOpts.bootstrap]
   * @param {Array<typeof SlashProtocol>} [opts.protocols]
   */
  constructor (opts = {}) {
    super()
    this._opts = opts

    this.keyPair = opts.keyPair
    this.remote = !this.keyPair
    this.url = opts.url ? new SlashURL(opts.url) : null
    this.key = opts.keyPair?.publicKey || opts.key || this.url?.slashtag.key
    if (!this.key) throw new Error('Missing keyPair, key, or url')

    this.url = this.url || new SlashURL(this.key)

    const store = opts.store || new Corestore(RAM)
    this.store = store.namespace(this.key)

    this.swarm = this.remote ? opts.swarm : undefined

    if (!this.remote) {
      this._protocols = new Map()
      opts.protocols?.forEach((p) => registerProtocol(this, p))
    }

    this.closed = false

    this.publicDrive = new SlashDrive({
      store: this.store,
      key: this.key,
      keyPair: this.keyPair
    })

    // Gracefully shutdown
    goodbye(() => {
      !this.closed && debug('gracefully closing Slashtag')
      return this.close()
    })
  }

  /**
   * Sets up and resolves the publicDrive for this Slashtag.
   */
  async ready () {
    if (this._ready) return true
    this._ready = true
    debug('Opening slashtag: ' + this.url)

    if (!this.swarm) {
      const dht = this._opts.swarmOpts?.relays
        ? await Relayed.create(this._opts.swarmOpts)
        : await DHT.create(this._opts.swarmOpts || {})
      this.swarm = new Hyperswarm({
        ...this._opts.swarmOpts,
        keyPair: this.keyPair,
        dht
      })
      this._shouldDestroySwarm = true
      debug('Created Hyperswarm for: ' + this.url, { remote: this.remote })
      this.swarm?.on('connection', this._handleConnection.bind(this))
    }

    await this.publicDrive.ready()
    this._setupDiscovery(this.publicDrive)

    debug('Slashtag is ready: ' + this.url, {
      remote: this.remote,
      writable: this.publicDrive.writable,
      readable: this.publicDrive.readable
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
   * @param {Uint8Array | SlashURL | string} destination
   * @returns {Promise<{connection: SecretStream, peerInfo:PeerInfo}>}
   */
  async connect (destination) {
    if (this.remote) throw new Error('Cannot connect from a remote slashtag')
    const key =
      typeof destination === 'string'
        ? new SlashURL(destination).slashtag.key
        : destination instanceof SlashURL
          ? destination.slashtag.key
          : destination

    debug('connecting to: ' + new SlashURL(key))

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
   * Returns an instance of SlashProtocol for this Slashtag.
   *
   * @template {typeof SlashProtocol | string} P
   * @param {P} Protocol
   * @returns {InstanceType<P>}
   */
  protocol (Protocol) {
    return this._protocols?.get(
      typeof Protocol === 'string' ? Protocol : Protocol.protocol
    )
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

  /**
   * Returns the profile of the Slashtag from the public drive
   *
   * @returns {Promise<object | null>}
   */
  async getProfile () {
    await this.ready()
    const result = await this.publicDrive?.get(DRIVE_KEYS.profile)
    if (!result) return null
    return JSON.parse(b4a.toString(result))
  }

  /**
   * Creates a private drive namespaced to this slashtag's key,
   * or resolves a private drives shared by other slashtags.
   * See {@link SlashDrive} for more information.
   *
   * @param {object} opts
   * @param {string} [opts.name]
   * @param {boolean} [opts.encrypted]
   * @param {Uint8Array} [opts.key]
   * @param {import('./interfaces').KeyPair} [opts.keyPair]
   * @param {Uint8Array} [opts.encryptionKey]
   * @returns {Promise<SlashDrive>}
   */
  async drive (opts) {
    await this.ready()

    if (opts.name) opts.keyPair = await this.store.createKeyPair(opts.name)
    const drive = new SlashDrive({ ...opts, store: this.store })
    await drive.ready()

    // TODO enable customizing the discovery option
    this._setupDiscovery(drive)

    return drive
  }

  async close () {
    if (this.closed) return
    debug('Slashtag closed', b4a.toString(this.key, 'hex'))
    this.closed = true
    this.emit('close')
    this._shouldDestroySwarm && (await this.swarm?.destroy())
    await this.store.close()
  }

  /**
   * Creates a Slashtags KeyPair, randomly or optionally from primary key and a name.
   *
   * @param {Uint8Array} [primaryKey]
   * @param {string | Uint8Array} [name]
   */
  static createKeyPair (primaryKey = randomBytes(), name = '') {
    return createKeyPair(primaryKey, name)
  }

  /**
   *
   * @param {SlashDrive} drive
   * @param {*} opts
   */
  async _setupDiscovery (drive, opts = {}) {
    await drive.ready()

    this.swarm?.join(drive.discoveryKey, opts)

    const done = drive.findingPeers()
    this.swarm?.flush().then(done, done)
  }

  /**
   * Augment Server and client's connections with Slashtag protocols and peerInfo.slashtag.
   *
   * @param {SecretStream} socket
   * @param {PeerInfo} peerInfo
   */
  async _handleConnection (socket, peerInfo) {
    if (socket.remoteSlashtag) return

    this.store.replicate(socket)

    socket.slashtag = this
    const remoteSlashtag = this._createRemoteSlashtag(peerInfo.publicKey)
    socket.remoteSlashtag = remoteSlashtag
    peerInfo.slashtag = remoteSlashtag

    this._debugSocket(socket, peerInfo)

    this._setupProtocols(socket, peerInfo)
    this.emit('connection', socket, peerInfo)
  }

  /**
   *
   * @param {SecretStream} socket
   * @param {PeerInfo} peerInfo
   */
  _debugSocket (socket, peerInfo) {
    const info = {
      local: this.url.toString(),
      remote: peerInfo.slashtag.url.toString()
    }

    socket.once('open', function () {
      swarmDebug('Swarm connection OPENED', info)
      socket.on('error', onError)
      socket.once('close', onClose)
    })

    function onError (/** @type {Error} */ err) {
      swarmDebug('Swarm connection ERRORED', err, info)
    }
    function onClose () {
      swarmDebug('Swarm connection CLOSED', info)
    }
  }

  /**
   * Create a remote Slashtag instance that shares this slashtag's resources.
   *
   * @param {Uint8Array} key
   * @returns
   */
  _createRemoteSlashtag (key) {
    return new Slashtag({
      key,
      swarm: this._opts.swarm || this.swarm,
      store: this.store
    })
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
 * @typedef {import('./interfaces').ProtomuxMessage } ProtomuxMessage
 * @typedef {import('./interfaces').ProtomuxChannel } ProtomuxChannel
 */

/**
 * Registers a SlashProtocol for a the Slashtags instance.
 * @param {Slashtag} slashtag
 * @param {typeof SlashProtocol} Protocol
 */
function registerProtocol (slashtag, Protocol) {
  // @ts-ignore
  const name = Protocol.protocol

  let protocol = slashtag._protocols?.get(name)
  if (protocol) return protocol
  protocol = new Protocol({ slashtag })
  slashtag._protocols?.set(name, protocol)
  return protocol
}
