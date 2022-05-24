import { EventEmitter } from 'events'
import Debug from 'debug'

const debug = Debug('slashtags:protocol')

export class SlashProtocol extends EventEmitter {
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

  onopen () {
    debug(`"${this.protocol}" opened `, {
      // @ts-ignore
      remote: this.peerInfo.slashtag.url.toString()
    })
  }

  onclose () {
    debug(`"${this.protocol}" closed `, {
      // @ts-ignore
      remote: this.peerInfo.slashtag.url.toString()
    })
  }

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
   * @param {Uint8Array | SlashURL | string} key
   * @returns {Promise<{connection: SecretStream, channel:ProtomuxChannel}>}
   */
  async connect (key) {
    const { connection } = await this.slashtag.connect(key)
    const channel = getChannel(connection, this.protocol)

    debug('connected to: ' + channel.peerInfo.slashtag.url)
    return { connection, channel }
  }
}

/**
 * Gets a specific protocol's channel from stream.
 *
 * @param {SecretStream} stream
 * @param {SlashProtocol} protocol
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
 * @typedef {import('./url').SlashURL } SlashURL
 */
