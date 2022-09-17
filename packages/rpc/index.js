import ProtomuxRPC from 'protomux-rpc'
import EventEmitter from 'events'
import b4a from 'b4a'

const RPCS_SYMBOL = Symbol.for('slashtags-rpcs')

export class SlashtagsRPC extends EventEmitter {
  /** @param {Slashtag} [slashtag] */
  constructor (slashtag) {
    super()
    this.slashtag = slashtag
    this.slashtag?.on('connection', this.setup.bind(this))
  }

  /**
   * RPC Identifier
   * @type {string}
   */
  get id () { throw new Error('id should be defined') }

  /**
   * Default value encoding for requests and responses
   * @type {import ('compact-encoding').Encoding | undefined}
   */
  get valueEncoding () { return undefined }

  /**
   * Handshake value encoding
   * @type {import ('compact-encoding').Encoding | undefined }
   */
  get handshakeEncoding () { return undefined }

  /**
   * Return a Handshake sent on channel opening.
   * @param {SecretStream} stream
   * @returns {any}
   */
  handshake (stream) { return null }

  /**
   * Callback function on opening a channel
   * @param {any} handshake
   * @param {SecretStream} socket
   */
  onopen (handshake, socket) { }

  /**
   * RPC methods
   * @type {RPCMethod[]}
   */
  get methods () { return [] }

  /**
   * Create a new RPC instance on the stream if doesn't already exist
   * @param {SecretStream} stream
   * @returns {ProtomuxRPC}
   */
  setup (stream) {
    // @ts-ignore
    const map = stream[RPCS_SYMBOL] = stream[RPCS_SYMBOL] || new Map()
    const existing = map.get(this.id)
    if (existing) return existing

    const options = {
      id: b4a.from(this.id),
      valueEncoding: this.valueEncoding,
      handshakeEncoding: this.handshakeEncoding,
      handshake: this.handshake(stream)
    }
    const rpc = new ProtomuxRPC(stream, options)

    map.set(this.id, rpc)

    rpc.on('open', (handshake) => this.onopen.bind(this)(handshake, stream))

    this.methods.forEach(m =>
      rpc.respond(m.name, m.options || {}, req => m.handler(req, stream))
    )

    return rpc
  }

  /**
   * Connect to a peer if not already connected, and return Protomux RPC instance.
   * @param {Parameters<Slashtag['connect']>[0]} key
   * @returns {Promise<ProtomuxRPC | undefined>}
   */
  async rpc (key) {
    if (!this.slashtag) throw new Error('Can not call rpc() if not initialized with a Slashtag instance')
    const socket = this.slashtag.connect(key)
    await socket.opened
    return this.setup(socket)
  }
}

export default SlashtagsRPC

/**
 * @typedef {{
 *  name: string,
 *  options?: import('protomux-rpc').methodOpts,
 *  handler: (req: any, socket: SecretStream) => any
 * }} RPCMethod
 *
 * @typedef {import('@synonymdev/slashtag').Slashtag}Slashtag
 * @typedef {import('@hyperswarm/secret-stream')} SecretStream
 */
