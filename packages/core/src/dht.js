const isNode = () =>
  typeof process === 'object' &&
  typeof process.versions === 'object' &&
  typeof process.versions.node !== 'undefined'

const DEFAULT_RELAY_SERVER = 'ws://testnet3.hyperdht.org:8910'
/** @type {DHT} */
let _DHT

/**
 * Returns a Hyperswarm DHT or a DHT relay according to the runtime environment
 * @param {string} relay
 * @returns {Promise<DHT>}
 */
export const DHT = async (relay = DEFAULT_RELAY_SERVER) => {
  if (_DHT) return _DHT

  if (isNode()) {
    // @ts-ignore
    const DHT = (await import('@hyperswarm/dht')).default
    _DHT = new DHT()
  } else {
    // @ts-ignore
    const ws = await import('@hyperswarm/dht-relay/ws')
    const websocket = new window.WebSocket(relay)
    // @ts-ignore
    const { Node } = await import('@hyperswarm/dht-relay')
    _DHT = Node.fromTransport(ws, websocket)
  }

  return _DHT
}
/** @typedef {import('./interfaces').DHT} DHT */
