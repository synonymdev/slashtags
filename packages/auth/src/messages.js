import { CURRENT_VERSION, KNOWN_VERSIONS } from './constants.js'
import * as varint from './varint.js'

/**
 * Encode version code, challenge and responder's publickey
 * @param {Uint8Array} challenge
 * @param {KeyPair["publicKey"]} publicKey
 * @returns {Uint8Array} <version-code><challenge-len><challenge><pk>
 */
export const encodeChallenge = (challenge, publicKey) => {
  return varint.prepend(
    [CURRENT_VERSION, challenge.byteLength],
    Uint8Array.from([...challenge, ...publicKey])
  )
}

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
 * Read challenge and publickey from a challenge message
 * @param {Uint8Array} message <version-code><challenge-len><challenge><rest>
 * @returns {{
 *  challenge: Uint8Array,
 *  remotePK: KeyPair["publicKey"]
 * }}}
 */
export const decodeChallenge = (message) => {
  const [version, versionFree] = varint.split(message)
  validateVersion(version)

  const [challengeLength, challengeLenFree] = varint.split(versionFree)

  return {
    challenge: challengeLenFree.slice(0, challengeLength),
    remotePK: challengeLenFree.slice(challengeLength)
  }
}

/**
 * Encode version code, attestation source, challenge and responder's publickey
 * @param {AttestationSource} attestationSource
 * @param {number} splitAt
 * @param {Uint8Array} signed
 * @returns {Uint8Array} <version-code><attestation-source><splitAt><signed <a><b>>
 */
export const encodeAttestation = (attestationSource, splitAt, signed) => {
  return varint.prepend([CURRENT_VERSION, attestationSource, splitAt], signed)
}

/**
 * Read challenge, publickey, and source of attestation from a message
 * @param {Uint8Array} message <version-code><attestation-source><splitAt><signed <a><b>>
 * @returns {{
 *  attestationSource: number
 *  splitAt: number,
 *  signedMessage: Uint8Array
 * }}}
 */
export const decodeAttestation = (message) => {
  const [version, versionFree] = varint.split(message)
  validateVersion(version)

  const [attestationSource, soruceFree] = varint.split(versionFree)
  const [splitAt, signedMessage] = varint.split(soruceFree)

  return { attestationSource, splitAt, signedMessage }
}

/** @typedef {import('./interfaces').KeyPair} KeyPair */
/** @typedef {import('./interfaces').Serializable} Serializable */
/** @typedef {import('./constants').AttestationSource} AttestationSource */
