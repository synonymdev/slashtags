import { WebSocketServer } from 'ws'

import DHT from '@hyperswarm/dht'
import { relay } from '@hyperswarm/dht-relay'
import Stream from '@hyperswarm/dht-relay/ws'

/**
 * @param {object} opts
 * @param {DHTOpts} [opts.dhtOpts]
 * @param {number} [opts.port]
 *
 * @returns {{
 *  dht: import('@hyperswarm/dht'),
 *  server: import('ws').WebSocketServer,
 *  port: number,
 *  close: () => Promise<any>,
 * }}
 */
export default function run (opts = {}) {
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

  server.on('error', () => {})
  server.on('connection', socket => {
    socket.on('error', () => {})
  })

  return server
}

/**
 * @typedef {ConstructorParameters<typeof import('@hyperswarm/dht')>[0]} DHTOpts
 */
