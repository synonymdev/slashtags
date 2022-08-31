import ProtomuxRPC from 'protomux-rpc'
import EventEmitter from 'events'

const RPCS_SYMBOL = Symbol.for('slashtags-rpcs')

export class SlashtagsRPC extends EventEmitter {
  /** @param {Slashtag} slashtag */
  constructor (slashtag) {
    super()
    this.slashtag = slashtag
    this.slashtag.on('connection', this.setup.bind(this))
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
   * @param {SecretStream} socket
   */
  setup (socket) {
    // @ts-ignore Deduplicate ProtomuxRPC instances on the same socket
    if (socket[RPCS_SYMBOL]?.get(this.id)) return
    // @ts-ignore
    if (!socket[RPCS_SYMBOL]) socket[RPCS_SYMBOL] = new Map()

    const options = {
      id: Buffer.from(this.id),
      valueEncoding: this.valueEncoding,
      handshakeEncoding: this.handshakeEncoding,
      handshake: this.handshake(socket)
    }
    const rpc = new ProtomuxRPC(socket, options)

    // @ts-ignore
    socket[RPCS_SYMBOL].set(this.id, rpc)

    rpc.on('open', (handshake) => this.onopen.bind(this)(handshake, socket))

    this.methods.forEach(m =>
      rpc.respond(m.name, m.options || {}, req => m.handler(req, socket))
    )
  }

  /**
   * Connect to a peer if not already connected, and return Protomux RPC instance.
   * @param {Parameters<Slashtag['connect']>[0]} key
   * @returns {Promise<ProtomuxRPC | undefined>}
   */
  async rpc (key) {
    const socket = this.slashtag.connect(key)
    await socket.opened
    this.setup(socket)

    // @ts-ignore
    return socket[RPCS_SYMBOL].get(this.id)
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
 * @typedef {import('@synonymdev/slashtag/lib/interfaces').SecretStream} SecretStream
 */
