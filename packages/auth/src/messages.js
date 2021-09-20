import { CURRENT_VERSION, KNOWN_VERSIONS } from './constants.js'
import { varint } from '@synonymdev/slashtags-common'

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
 * Encode version code, attestation source, challenge and responder's publickey
 * @param {Uint8Array} signed
 * @param {number} metadataOffset
 * @returns {Uint8Array} <version><metadata-offset><signed <challenge/pk><metadata>>
 */
export const encodeAttestation = (signed, metadataOffset) => {
  return varint.prepend([CURRENT_VERSION, metadataOffset], signed)
}

/**
 * Read challenge, publickey, and source of attestation from a message
 * @param {Uint8Array} message <version><metadataOffset><signed <challenge/pk><metadata>>
 * @returns {{
 *  metadataOffset: number,
 *  signedMessage: Uint8Array
 * }}}
 */
export const decodeAttestation = (message) => {
  const [version, versionFree] = varint.split(message)
  validateVersion(version)

  const [metadataOffset, signedMessage] = varint.split(versionFree)

  return { signedMessage, metadataOffset }
}
