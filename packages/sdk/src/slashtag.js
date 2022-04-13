import b4a from 'b4a'
import EventEmitter from 'events'
import Hyperswarm from 'hyperswarm'
import { SlashDrive } from './drive/index.js'
import { SDK } from './index.js'
import Hypercore from 'hypercore'
import Debug from 'debug'

const debug = Debug('slashtags:slashtag')

export class Slashtag extends EventEmitter {
  constructor (opts) {
    super()
    this.sdk = opts.sdk
    this.protocols = new Map()

    this._ready = false

    const keyPair =
      opts.keyPair || (opts.name && this.sdk.keys.generateKeyPair(opts.name))

    if (keyPair) {
      this.key = keyPair.publicKey
    } else if (opts.key) {
      this.key = opts.key
      this.remote = true
    } else {
      throw new Error('Missing keyPair or key')
    }

    this.url = SDK.formatURL(this.key)

    this.swarm = new Hyperswarm({ dht: this.sdk.dht, keyPair })

    this.drive = new SlashDrive({
      store: this.sdk.store,
      keys: this.sdk.keys,
      key: this.key,
      keyPair: keyPair
    })

    this.swarm.on('connection', this._handleConnection.bind(this))
  }

  async ready () {
    if (this._ready) return
    await this.drive.ready()

    this.writable = this.drive.writable

    // TODO: pass options to the swarm discovery
    const discovery = this.swarm.join(this.drive.discoveryKey).flushed()

    if (this.writable) {
      await discovery
    } else {
      const done = this.drive.findingPeers()
      await this.swarm.flush().then(done, done)
    }

    if (this) this._ready = true
  }

  async listen () {
    return this.swarm.listen()
  }

  async connect (key) {
    for (const socket of this.swarm.connections) {
      if (b4a.equals(socket.remotePublicKey, key)) return socket
    }

    const socket = new Promise((resolve) => {
      this.swarm.on(
        'connection',
        (socket) => b4a.equals(socket.remotePublicKey, key) && resolve(socket)
      )
    })

    this.swarm.joinPeer(key)

    return socket
  }

  async _handleConnection (socket, peerInfo) {
    this.sdk.store.replicate(socket)

    socket.on('error', function (err) {
      debug('Error in swarm connection', err)
    })
    socket.on('close', function () {
      debug(
        'Swarm connection closed',
        b4a.toString(socket.remotePublicKey, 'hex')
      )
    })

    this._setupProtocols(socket, peerInfo)

    debug('got connection, isInitiator:', socket.isInitiator)

    peerInfo.slashtag = this.sdk.slashtag({ key: peerInfo.publicKey })

    this.emit('connection', socket, peerInfo)
  }

  _setupProtocols (socket, peerInfo) {
    for (const protocol of this.protocols.values()) {
      const mux = Hypercore.getProtocolMuxer(socket)
      const channel = mux.createChannel(protocol.options)
      if (!channel) return

      channel.peerInfo = peerInfo
      channel.open()
    }
  }

  close () {
    return this.swarm.destroy()
  }

  registerProtocol (Protocol) {
    const protocol = new Protocol(this)
    this.protocols.set(protocol.options.protocol, protocol)
    return protocol
  }

  async setProfile (profile) {
    await this.ready()
    return this.drive.write('/profile.json', b4a.from(JSON.stringify(profile)))
  }

  async getProfile () {
    await this.ready()
    const buffer = await this.drive.read('/profile.json')
    return buffer && JSON.parse(b4a.toString(buffer))
  }
}
