// @ts-ignore
import _DHT from '@hyperswarm/dht'

export default { DHT: _DHT }

/**
 * Returns a Hyperswarm DHT or a DHT relay according to the runtime environment
 *
 * @param {object} [opts]
 * @param {string[]} [opts.relays]
 * @returns {Promise<DHT>}
 */
export const DHT = async (opts) => {
  return new _DHT(opts)
}

/** @typedef {import('./interfaces').DHT} DHT */
