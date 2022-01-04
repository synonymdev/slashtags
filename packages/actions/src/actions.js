import { base32 } from 'multiformats/bases/base32'
import { varint } from '@synonymdev/slashtags-common'
import { ACT1 } from './implemntations/act1.js'
import { verifyFactory } from '@synonymdev/slashtags-auth'

/**
 * @param {string} address
 */
const decodeAddress = (address) => {
  const bytes = base32.decode(address)

  let result = varint.split(bytes)
  result = varint.split(result[1])

  return result[1]
}

/**
 *
 * @param {string} url
 */
const parseUrl = (url) => {
  const _url = new URL(url.replace('slash', 'http'))

  const tkt = _url.searchParams.get('tkt')
  const act = _url.searchParams.get('act')
  const action = act && 'ACT' + act

  const address = decodeAddress(_url.hostname)

  return {
    action,
    tkt,
    address
  }
}

/**
 * @param {SlashtagsAPI} node
 * @param {object} [opts]
 * @param {ResolverRegistry} [opts.didResolverRegistry]
 * @returns
 */
export const Actions = (node, opts) => {
  const supportedActions = ['ACT1']
  const verify = verifyFactory(opts?.didResolverRegistry)

  /**
   *
   * @param {string} url
   * @param {CallBacks} [callbacks]
   * @param {OnError} [onError]
   * @returns
   */
  const handle = async (url, callbacks, onError) => {
    const { address, action, tkt } = parseUrl(url)

    if (!action) {
      onError?.({
        code: 'MalformedURL',
        message: 'Missing param: act',
        url
      })
      return
    }

    if (!tkt) {
      onError?.({
        code: 'MalformedURL',
        message: 'Missing param: tkt',
        url
      })
      return
    }

    const _callbacks = callbacks?.[action]

    /** @param {any} error */
    const handleCaughtErrors = (error) => {
      if (error?.message) {
        onError?.({
          code: error.message,
          url
        })
      } else {
        onError?.({
          code: 'TicketNotFound',
          message: error?.error?.message,
          url
        })
      }
    }

    switch (action) {
      case 'ACT1':
        return ACT1({
          node,
          address,
          tkt,
          callbacks: _callbacks,
          verify
        }).catch(handleCaughtErrors)

      default:
        onError?.({
          code: 'UnsupportedAction',
          message: `Unsupported action: actions must be one of: ${JSON.stringify(
            supportedActions
          )}, but got: "${action}"`,
          url
        })
    }
  }

  return { supportedActions, handle }
}

/** @typedef {import ('./interfaces').CallBacks} CallBacks */
/** @typedef {import ('@synonymdev/slashtags-core').SlashtagsAPI} SlashtagsAPI */
/** @typedef {import('did-resolver').ResolverRegistry} ResolverRegistry */
/** @typedef {import ('./interfaces').OnError} OnError */
