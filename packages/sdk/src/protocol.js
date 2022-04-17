import { EventEmitter } from 'events'

export class SlashtagProtocol extends EventEmitter {
  constructor (opts) {
    super()
    this.slashtag = opts.slashtag
    this.protocol = this.constructor.protocol
  }

  createChannel (stream, peerInfo) {
    const mux = getProtocolMuxer(stream)
    const channel = mux.createChannel(this)
    if (!channel) return

    channel.peerInfo = peerInfo
    channel.open()

    return channel
  }

  async connect (key) {
    const connection = await this.slashtag.connect(key)
    const channel = getChannel(connection, this.protocol)

    return { connection, channel }
  }
}

function getChannel (stream, protocol) {
  const mux = getProtocolMuxer(stream)

  for (const channel of mux) {
    if (channel.protocol === protocol) {
      return channel
    }
  }
}

function getProtocolMuxer (stream) {
  return stream.noiseStream.userData
}
