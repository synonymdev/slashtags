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

  close () {
    return this.swarm.destroy()
  }

  registerProtocol (Protocol) {
    const protocol = new Protocol(this)

    this.on('connection', (socket) => {
      const mux = socket.userData
      const channel = mux.createChannel(protocol.options)
      channel.slashtag = this
      protocol.messages = channel.messages

      channel.open()
    })

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
