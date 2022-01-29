// @ts-nocheck
let dhtRelay

const tryWS = async (wsServer) =>
  new Promise((resolve) => {
    wsServer.onerror = (error) => resolve(!error)
    wsServer.onopen = () => resolve(wsServer)
  })

/**
 *
 * @param {string[]} relays
 * @returns
 */
const makeRelayFactory = async (relays) => {
  const WebSocket = await (await import('isomorphic-ws')).default

  let wsServer, relay
  while (!wsServer && (relay = relays.shift())) {
    wsServer = await tryWS(new WebSocket(relay))
  }

  if (!wsServer) {
    throw new Error('Could not connect to any of the provided DHT relays')
  }

  const node = (await import('@hyperswarm/dht-relay')).Node
  const ws = (await import('@hyperswarm/dht-relay/ws')).default
  return () => node.fromTransport(ws, wsServer)
}

/**
 * Returns a Hyperswarm DHT or a DHT relay according to the runtime environment
 *
 * @param {object} [opts]
 * @param {string[]} [opts.relays]
 * @returns {Promise<DHT>}
 */
export const DHT = async (opts) => {
  dhtRelay = await (dhtRelay || makeRelayFactory(opts.relays))
  return dhtRelay()
}

/** @typedef {import('./interfaces').DHT} DHT */
