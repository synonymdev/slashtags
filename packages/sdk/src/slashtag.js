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

  async _handleConnection (conn, peerInfo) {
    const slashtag = new Slashtag({
      sdk: this.sdk,
      url: formatURL(conn.remotePublicKey)
    })
    slashtag.ready()

    conn.remoteSlashtag = slashtag

    debug(
      'got connection, isInitiator:',
      conn.isInitiator,
      'remoteSlashtag:',
      slashtag.url
    )

    this.emit('connection', conn, Object.assign(peerInfo, slashtag))
  }

  close () {
    return this.swarm.destroy()
  }
}

function toBase32 (buf) {
  return b32.encode(b4a.from(buf)).replace(/[=]/g, '').toLowerCase()
}

function fromBase32 (str) {
  return b4a.from(b32.decode.asBytes(str.toUpperCase()))
}

function parseURL (url) {
  return new URL(url.replace(/^.*:\/\//, 'http://'))
}

function formatURL (buf) {
  return 'slash://' + toBase32(buf)
}
