import URI from 'urijs'
import { base32 } from 'multiformats/bases/base32'
import { varint } from '@synonymdev/slashtags-common'
import { ACT_1 } from './actions/act_1.js'
import bint from 'bint8array'

/**
 *
 * @param {string} url
 * @returns
 */
export const parseURL = (url) => {
  const uri = new URI(url)

  return { hostname: uri.hostname(), query: uri.search(true) }
}

/**
 * @param {string} address
 */
const processAddress = (address) => {
  const bytes = base32.decode(address)

  let result = varint.split(bytes)
  result = varint.split(result[1])
  result = varint.split(result[1])

  return new URL(bint.toString(result[1], 'utf-8')).toString()
}

/**
 * @param {object} opts
 * @param {SlashtagsAPI} opts.node
 * @returns
 */
export const SlashtagsActions = ({ node }) => {
  // TODO: Check if node is a SlashtagsAPI
  if (!node) {
    throw new Error('SlashActions requires a node implementing SlashtagsAPI')
  }

  const supportedActions = ['ACT_1']

  /**
   *
   * @param {string} url
   * @param {CallBacks} [callbacks]
   * @returns {Promise<HandleResponse>}
   */
  const handle = async (url, callbacks) => {
    // TODO: handle empty string or invalid url in general
    // TODO: check if the ticket is valid? for all actions?
    const { hostname, query } = parseURL(url)

    /** @type {{act: string, tkt: string}} */
    // @ts-ignore
    let { act, tkt } = query
    act = 'ACT_' + act

    const address = processAddress(hostname)

    if (!address) {
      return {
        status: 'SKIP',
        reason: 'Invalid address',
        address: hostname,
        act,
        tkt
      }
    }

    if (!supportedActions.includes(act)) {
      return {
        status: 'SKIP',
        reason: 'Unsupported action',
        act,
        tkt,
        address
      }
    }

    if (!callbacks?.[act]) {
      return {
        status: 'SKIP',
        reason: 'No callback for this action',
        act,
        tkt,
        address
      }
    }

    switch (act) {
      case 'ACT_1':
        return await ACT_1({
          node,
          address,
          act,
          tkt,
          // @ts-ignore
          callbacks: callbacks[act]
        })

      default:
        return {
          status: 'SKIP',
          reason: 'Unsupported action',
          act,
          tkt,
          address
        }
    }
  }

  return { supportedActions, handle }
}

/** @typedef {import ('@synonymdev/slashtags-core').SlashtagsAPI} SlashtagsAPI */
/** @typedef {import ('./interfaces').CallBacks} CallBacks */
/** @typedef {import ('./interfaces').HandleResponse} HandleResponse */
