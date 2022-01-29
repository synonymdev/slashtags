import { RPC } from '@synonymdev/slashtags-rpc'

/**
 * Create a new instance of Slashtags node.
 *
 * @param {object} [opts]
 * @param {string[]} [opts.relays]
 * @returns {Promise<SlashtagsAPI>}
 */
export const Core = async (opts) => {
  return RPC({ relays: opts?.relays })
}

/** @typedef {import ('./interfaces').SlashtagsAPI} SlashtagsAPI */
