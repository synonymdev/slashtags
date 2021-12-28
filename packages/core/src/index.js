import { RPC } from '@synonymdev/slashtags-rpc'

/**
 * Create a new instance of Slashtags node.
 * @param {object} [opts]
 * @param {object} [opts.rpc]
 * @param {string[]} [opts.rpc.relays]
 * @param {number} [opts.rpc.requestTimout]
 * @returns {Promise<SlashtagsAPI>}
 */
export const Core = async (opts) => {
  return RPC(opts?.rpc)
}

/** @typedef {import ('./interfaces').SlashtagsAPI} SlashtagsAPI */
