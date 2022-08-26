import { WebSocketServer } from 'ws'

import DHT from '@hyperswarm/dht'
import { relay } from '@hyperswarm/dht-relay'
import Stream from '@hyperswarm/dht-relay/ws'

/**
 * @param {object} opts
 * @param {DHTOpts} [opts.dhtOpts]
 * @param {number} [opts.port]
 */
export default async function run (opts = {}) {
  const server = setupServer(opts.port)
  const destroyDHT = dhtRelay(server, opts.dhtOpts)

  return {
    /** @type {number} */ // @ts-ignore
    port: server.address().port,
    close: () => Promise.all([destroyDHT(), server.close()])
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
 * @param {import('ws').Server} server
 * @param {DHTOpts} [opts]
 */
function dhtRelay (server, opts) {
  const dht = new DHT(opts)

  server.on('connection', socket => {
    relay(dht, new Stream(false, socket))
  })

  return () => dht.destroy()
}

/**
 * @typedef {ConstructorParameters<typeof import('@hyperswarm/dht')>[0]} DHTOpts
 */
