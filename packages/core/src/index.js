import { RPC } from '@synonymdev/slashtags-rpc'

/**
 * Create a new instance of Slashtags node.
 * @returns {Promise<SlashtagsAPI>}
 */
export const Core = async () => {
  return RPC()
}

/** @typedef {import ('./interfaces').SlashtagsAPI} SlashtagsAPI */
