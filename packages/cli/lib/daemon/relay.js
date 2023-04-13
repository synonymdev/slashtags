const { WebSocketServer } = require('ws')

const DHT = require('hyperdht')
const { relay } = require('@hyperswarm/dht-relay')
const Stream = require('@hyperswarm/dht-relay/ws')

/**
 * @param {object} opts
 * @param {DHTOpts} [opts.dhtOpts]
 * @param {number} [opts.port]
 *
 * @returns {{
 *  dht: import('hyperdht'),
 *  server: import('ws').WebSocketServer,
 *  port: number,
 *  close: () => Promise<any>,
 * }}
 */
function run (opts = {}) {
  const server = setupServer(opts.port)
  const dht = new DHT(opts.dhtOpts)

  server.on('connection', socket => {
    relay(dht, new Stream(false, socket))
  })

  return {
    dht,
    server,
    /** @type {number} */ // @ts-ignore
    port: server.address().port,
    close: () => Promise.all([dht.destroy(), server.close()])
  }
}

/** @param {number} [port] */
function setupServer (port = 0) {
  const server = new WebSocketServer({ port })

  server.on('error', () => { })
  server.on('connection', socket => {
    socket.on('error', () => { })
  })

  return server
}

module.exports = run

/**
 * @typedef {ConstructorParameters<typeof import('hyperdht')>[0]} DHTOpts
 */
