import * as DocID from '@synonymdev/slashtags-docid'
import { base64url } from 'multiformats/bases/base64'
import * as json from 'multiformats/codecs/json'
import { varint } from '@synonymdev/slashtags-common'
import { PROTOCOL_NAME } from './constants/index.js'
import { validate } from './validate.js'

/**
 *
 * @param {string} url
 * @param {boolean} [throwInvalid=false] Throw error on invalid payload
 * @throws {Error} Throws erros for invalid payload
 * @returns {{
 *   url: string;
 *   protocol: string;
 *   actionID: string;
 *   payload: Object;
 *  } | {
 *   url: string;
 *   protocol: string;
 *   docID: DocID;
 *   path: string;
 *   hash: string;
 *   query: Record<string, string>
 * }}
 */
export const parse = (url, throwInvalid = false) => {
  const parsed = new URL(url)
  const protocol = parsed.protocol.slice(0, parsed.protocol.length - 1)

  if (protocol !== PROTOCOL_NAME) {
    throw new Error('Protocol should be ' + PROTOCOL_NAME)
  }

  const docIDStr = parsed.hostname || parsed.pathname.split('/')[0]
  const docID = DocID.parse(docIDStr)

  if (!parsed.hostname) {
    const baseFree = base64url.decode(parsed.hash.substring(1))
    const payload = json.decode(varint.split(baseFree)[1])

    const validated = validate(docIDStr, payload, throwInvalid)

    return {
      url,
      protocol,
      actionID: DocID.toString(docID),
      payload: validated
    }
  }

  return {
    url,
    protocol,
    docID,
    path: parsed.pathname,
    hash: parsed.hash,
    query: Object.fromEntries(parsed.searchParams)
  }
}

/** @typedef {import('@synonymdev/slashtags-docid').DocID} DocID */
