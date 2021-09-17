import { secp256k1 } from 'noise-curve-tiny-secp'

export const PROLOGUE = new Uint8Array(0)
export const DEFAULT_CHALLENGE_LENGTH = 32

/** @type {Curve} */
export const DEFAULT_CURVE = secp256k1

/** For upgradability and backward compatibility */
export const CURRENT_VERSION = 0
export const KNOWN_VERSIONS = [0]

/** @typedef {import('./interfaces').Curve} Curve */
