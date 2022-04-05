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
      this.swarm = new Hyperswarm({ dht: this.sdk.dht, keyPair })

      this.listen = this.swarm.listen.bind(this.swarm)

      this.drive = new SlashDrive({
        sdk: this.sdk,
        keyPair,
        swarm: this.swarm
      })
    } else if (opts.key) {
      this.key = opts.key
      this.swarm = new Hyperswarm({ dht: this.sdk.dht })
      this.remote = true

      this.drive = new SlashDrive({
        sdk: this.sdk,
        key: this.key,
        swarm: this.swarm
      })
    } else {
      throw new Error('Missing keyPair or key')
    }

    this.swarm.on('connection', (socket, peerInfo) => {
      this.sdk.store.replicate(socket)
      this._handleConnection(socket, peerInfo)
    })

    this.url = SDK.formatURL(this.key)
  }

  async ready () {
    if (this._ready) return
    await this.drive?.ready()
    this._ready = true
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
    this._setupProtocols(socket, peerInfo)

    debug('got connection, isInitiator:', socket.isInitiator)

    peerInfo.slashtag = this.sdk.slashtag({ key: peerInfo.publicKey })

    this.emit('connection', socket, peerInfo)
  }

  _setupProtocols (socket, peerInfo) {
    for (const protocol of this.protocols.values()) {
      const mux = Hypercore.getProtocolMuxer(socket)
      if (!mux.channels) mux.channels = new Map()

      const channel = mux.createChannel(protocol.options)
      if (!channel) return

      channel.peerInfo = peerInfo

      mux.channels.set(channel.protocol, channel)
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
