import { EventEmitter } from 'events'

export class SlashtagProtocol extends EventEmitter {
  /**
   *
   * @param {object} opts
   * @param {import('./index').Slashtag} opts.slashtag
   */
  constructor (opts) {
    super()
    this.slashtag = opts.slashtag
    // @ts-ignore
    this.protocol = this.constructor.protocol
  }

  /** @type {string} */
  // @ts-ignore
  static get protocol () {}

  /** @type {Array<import('./interfaces').ProtomuxMessage>} */
  // @ts-ignore
  get messages () {}

  /**
   * Creates a new protocol channel.
   *
   * @param {SecretStream} stream
   * @param {PeerInfo} peerInfo
   * @returns {ProtomuxChannel | null}
   */
  createChannel (stream, peerInfo) {
    const mux = getProtocolMuxer(stream)
    const channel = mux.createChannel(this)
    if (!channel) return null

    channel.peerInfo = peerInfo
    channel.open()

    return channel
  }

  /**
   * Connect to a slashtag supporting this protocol, and return the connection, and channel.
   *
   * @param {Uint8Array} key
   * @returns {Promise<{connection: SecretStream, channel:ProtomuxChannel}>}
   */
  async connect (key) {
    const { connection } = await this.slashtag.connect(key)
    const channel = getChannel(connection, this.protocol)

    return { connection, channel }
  }
}

/**
 * Gets a specific protocol's channel from stream.
 *
 * @param {SecretStream} stream
 * @param {SlashtagProtocol} protocol
 * @returns
 */
function getChannel (stream, protocol) {
  const mux = getProtocolMuxer(stream)

  for (const channel of mux) {
    if (channel.protocol === protocol) {
      return channel
    }
  }
}

/**
 * Get protocol muxer from a corestore's replication stream.
 *
 * @param {SecretStream} stream
 * @returns
 */
function getProtocolMuxer (stream) {
  // @ts-ignore
  return stream.noiseStream.userData
}

/**
 * @typedef {import('./interfaces').ProtomuxChannel } ProtomuxChannel
 * @typedef {import('./interfaces').PeerInfo } PeerInfo
 * @typedef {import('./interfaces').SecretStream } SecretStream
 */