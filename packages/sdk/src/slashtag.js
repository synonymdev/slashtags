import b32 from 'hi-base32'
import b4a from 'b4a'
import EventEmitter from 'events'
import Hyperswarm from 'hyperswarm'
import Debug from 'debug'

const debug = Debug('slashtags:slashtag')

export class Slashtag extends EventEmitter {
  constructor (opts) {
    super()
    this.sdk = opts.sdk
    this.protocols = new Map()

    if (opts.keyPair) {
      this.key = opts.keyPair.publicKey
      this.url = this.url || 'slash://' + toBase32(this.key)

      this.swarm = new Hyperswarm({
        dht: this.sdk.dht,
        keyPair: opts.keyPair
      })

      this.swarm.on('connection', (socket, peerInfo) => {
        this.sdk.store.replicate(socket)
        this._handleConnection(socket, peerInfo)
      })

      this.listen = this.swarm.listen.bind(this.swarm)
    }
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

    const slashtag = new Slashtag({
      sdk: this.sdk,
      url: Slashtag.formatURL(socket.remotePublicKey)
    })

    socket.remoteSlashtag = slashtag

    debug(
      'got connection, isInitiator:',
      socket.isInitiator,
      'remoteSlashtag:',
      slashtag.url
    )

    this.emit('connection', socket, Object.assign(peerInfo, slashtag))
  }

  _setupProtocols (socket, peerInfo) {
    for (const protocol of this.protocols.values()) {
      const mux = socket.userData
      if (!mux.channels) mux.channels = new Map()

      const channel = mux.createChannel(protocol.options)
      if (!channel) return

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

  static formatURL (key) {
    return 'slash://' + toBase32(key)
  }

  static parseURL (url) {
    const parsed = {}
    parsed.protocol = url.split('://')[0]
    url = new URL(url.replace(/^.*:\/\//, 'http://'))
    parsed.key = fromBase32(url.hostname)
    parsed.query = url.searchParams

    return parsed
  }
}

function toBase32 (buf) {
  return b32.encode(b4a.from(buf)).replace(/[=]/g, '').toLowerCase()
}

function fromBase32 (str) {
  return b4a.from(b32.decode.asBytes(str.toUpperCase()))
}
