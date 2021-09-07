import Noise from 'noise-handshake'
import sodium from 'sodium-universal'
import { DEFAULT_CHALLENGE_LENGTH } from './constants.js'

/**
 * Generate new random challenge
 * @param {number} challengeLength
 * @returns {Buffer}
 */
export const generateChallenge = (
  challengeLength = DEFAULT_CHALLENGE_LENGTH
) => {
  const challenge = Buffer.allocUnsafe(challengeLength)
  // @ts-ignore
  sodium.randombytes_buf(challenge)
  return challenge
}

/**
 * A wrapper around noise-handshake
 * @param {string} pattern
 * @param {boolean} initiator
 * @param {KeyPair} staticKeypair
 * @param {{curve: Curve}} opts
 * @returns {Noise}
 */
export const createHandshake = (pattern, initiator, staticKeypair, opts) => {
  // @ts-ignore
  return new Noise(pattern, initiator, staticKeypair, opts)
}

/**
 * Checks if a publicKey (and secretKey if available) is valid for a given elliptic curve
 * @param {Curve} curve
 * @param {KeyPair["publicKey"]} publicKey
 * @param {KeyPair["secretKey"]} [secretKey]
 * @throws {Error}
 * @returns {boolean}
 */
export const validateKeyForCurve = (curve, publicKey, secretKey) => {
  if (publicKey && curve.PKLEN !== publicKey.byteLength) {
    throw new Error('Invalid publicKey size for curve: ' + curve.ALG)
  }

  if (secretKey && curve.SKLEN !== secretKey.byteLength) {
    throw new Error('Invalid secretKey size for curve: ' + curve.ALG)
  }

  return true
}

/** @typedef {import('./interfaces').KeyPair} KeyPair */
/** @typedef {import('./interfaces').Curve} Curve */
/** @typedef {import('./interfaces').Noise} Noise */
