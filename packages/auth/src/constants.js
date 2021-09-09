import secp256k1 from 'noise-curve-secp'

export const PROLOGUE = Buffer.alloc(0)
export const DEFAULT_CHALLENGE_LENGTH = 32

/** @type {import('./interfaces').Curve} */
// @ts-ignore
export const DEFAULT_CURVE = secp256k1

/** For upgradability and backward compatibility */
export const CURRENT_VERSION = 0
export const KNOWN_VERSIONS = [0]

/**
 * A code to identify the source of attestation
 * @readonly
 * @enum {number}
 * @property {number} Initiator initiator's attestation, should be checked against sessions
 * @property {number} Responder responder's attestation, should be checked against sessions
 */
export const AttestationSource = {
  Initiator: 0,
  Responder: 1
}
