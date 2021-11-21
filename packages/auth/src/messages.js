import { CURRENT_VERSION, KNOWN_VERSIONS } from './constants.js'
import { varint } from '@synonymdev/slashtags-common'
import bint from 'bint8array'

/**
 * Check the version of SlashtagsAuth
 * @param {number} version
 * @throws {Error}
 */
const validateVersion = (version) => {
  if (!KNOWN_VERSIONS.includes(version)) {
    throw new Error('Unknown SlashtagsAuth version code')
  }
}

/**
 * Encode version code, metdata-length, and challenge or responder's publickey
 * @param {Uint8Array} metadata
 * @param {Uint8Array} rest challenge or the responder's public key
 * @returns {Uint8Array} <version><count><metadata><challenge/pk>
 */
export const encodePayload = (metadata, rest) => {
  return varint.prepend(
    [CURRENT_VERSION, metadata.byteLength],
    bint.concat([metadata, rest])
  )
}

/**
 * Extract the metadata, and challenge/responderPK from noise payload
 * @param {Uint8Array} message <version><count><metadata><rest:challenge/pk>
 * @returns {{
 *  metadata: Uint8Array
 *  rest: Uint8Array
 * }}}
 */
export const decodePayload = (message) => {
  const [version, versionFree] = varint.split(message)
  validateVersion(version)

  const [count, concatenated] = varint.split(versionFree)

  return {
    metadata: concatenated.subarray(0, count),
    rest: concatenated.subarray(count)
  }
}

/**
 * Safely parse metadata as JSON
 * @param {Uint8Array} metadata
 * @returns {JSON}
 */
export const safeParse = (metadata) => {
  try {
    return JSON.parse(new TextDecoder().decode(metadata))
  } catch (error) {
    return null
  }
}

/** @typedef {import('./interfaces').JSON} JSON */
