const ProtomuxRPC = require('protomux-rpc')
const EventEmitter = require('events')
const b4a = require('b4a')
const HashMap = require('turbo-hash-map')
const SlashURL = require('@synonymdev/slashtags-url')

const RPCS_SYMBOL = Symbol.for('slashtags-rpcs')
const CONNECT_TIMEOUT = 10000

class SlashtagsRPC extends EventEmitter {
  /**
   * @param {object} opts
   * @param {import('hyperswarm')} opts.swarm
   **/
  constructor (opts) {
    super()

    /**
     * @type {import('@synonymdev/slashtag')}
     * @deprecated use new SlashtagsRPC({swarm}) instead
     */
    // @ts-ignore
    this.slashtag = opts

    this._allConnections = new HashMap()
    this._swarm = opts.swarm

    this._swarm.on('connection', this.setup.bind(this))
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

    // Set connections inside setup, so any connections that come from
    // this._swarm.on('conneciton') in the constructor will be cached too.
    this._allConnections.set(stream.remotePublicKey, stream)
    stream.once('close', () => this._allConnections.delete(stream.remotePublicKey))

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
    /** @type {Uint8Array} */
    let publicKey

    if (typeof key === 'string') {
      if (key.startsWith('slash')) {
        publicKey = SlashURL.parse(key).key
      } else {
        publicKey = SlashURL.decode(key)
      }
    } else {
      // @ts-ignore
      publicKey = key
    }

    // duplicate logic from Hyperswarm's internal connections management, but swarm._allConnections is not a public API, so we can't rely on it.
    const existingConnection = this._allConnections.get(publicKey)
    if (existingConnection) {
      // this.setup() is idempotent
      return this.setup(existingConnection)
    }

    this._swarm.joinPeer(publicKey)

    // Await for connecting to every seeder for unit testing convenience
    return new Promise((resolve) => {
      /** @param {import('protomux-rpc')} rpc */
      const cleanupAndResolve = (rpc) => {
        this._swarm.removeListener('connection', onConnection)
        resolve(rpc)
      }

      /** @param {SecretStream} connection */
      const onConnection = (connection) => {
        if (b4a.equals(connection.remotePublicKey, publicKey)) {
          cleanupAndResolve(this.setup(connection))
        }
      }

      // Timeout to avoid blocking this.ready()
      setTimeout(cleanupAndResolve, CONNECT_TIMEOUT)

      this._swarm.on('connection', onConnection.bind(this))
    })
  }
}

module.exports = SlashtagsRPC

/**
 * @typedef {{
 *  name: string,
 *  options?: import('protomux-rpc').methodOpts,
 *  handler: (req: any, socket: SecretStream) => any
 * }} RPCMethod
 *
 * @typedef {import('@synonymdev/slashtag')}Slashtag
 * @typedef {import('@hyperswarm/secret-stream')} SecretStream
 */
