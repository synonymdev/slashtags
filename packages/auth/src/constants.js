import * as secp256k1 from 'noise-curve-secp'

export const PROLOGUE = Buffer.alloc(0)
export const DEFAULT_CHALLENGE_LENGTH = 32

/** @type {import('./interfaces').Curve} */
// @ts-ignore
export const DEFAULT_CURVE = secp256k1

/** For upgradability and backward compatibility */
export const CURRENT_VERSION = 0
export const KNOWN_VERSIONS = [0]

/** A code to identify the source of attestation
 * @enum {number}
 */
export const AttestationSource = {
  //  0 = initiator's attestation, should be checked against sessions
  Initiator: 0,
  //  1 = responder's attestation, should be checked against sessions
  Responder: 1
}
