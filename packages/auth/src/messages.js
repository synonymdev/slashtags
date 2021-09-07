import {
  AttestationSource,
  CURRENT_VERSION,
  KNOWN_VERSIONS
} from './constants.js'
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
 * Read challenge and publickey from a challenge message
 * @param {Uint8Array} message <version-code><challenge-len><challenge><pk>
 * @returns {{
 *  challenge: Uint8Array,
 *  remotePK: KeyPair["publicKey"]
 * }}}
 */
export const decodeChallenge = (message) => {
  const [version, versionFree] = varint.split(message)
  if (!KNOWN_VERSIONS.includes(version)) { throw new Error('Unknown SlashtagsAuth version code') }

  const [challengeLength, challengeLenFree] = varint.split(versionFree)

  return {
    challenge: challengeLenFree.slice(0, challengeLength),
    remotePK: challengeLenFree.slice(challengeLength)
  }
}

/**
 * Encode version code, attestation source, challenge and responder's publickey
 * @param {AttestationSource} attestationSource
 * @param {number} challengeLen
 * @param {Uint8Array} signed
 * @returns {Uint8Array} <version-code><attestation-source><chlng-len><signed <challenge><metadata>>
 */
export const encodeAttestation = (attestationSource, challengeLen, signed) => {
  return varint.prepend(
    [CURRENT_VERSION, attestationSource, challengeLen],
    signed
  )
}

/**
 * Read challenge, publickey, and source of attestation from a message
 * @param {Uint8Array} message <version-code><attestation-source><chlng-len><signed <challenge><metadata>>
 * @returns {{
 *  attestationSource: number
 *  challengeLength: number,
 *  signedMessage: Uint8Array
 * }}}
 */
export const decodeAttestation = (message) => {
  const [version, versionFree] = varint.split(message)
  if (!KNOWN_VERSIONS.includes(version)) { throw new Error('Unknown SlashtagsAuth version code') }

  const [attestationSource, soruceFree] = varint.split(versionFree)
  const [challengeLength, signedMessage] = varint.split(soruceFree)

  return { attestationSource, challengeLength, signedMessage }
}

/** @typedef {import('./interfaces').KeyPair} KeyPair */
/** @typedef {import('./interfaces').Serializable} Serializable */
