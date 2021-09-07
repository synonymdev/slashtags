import { createHandshake } from '../crypto.js'
import { DEFAULT_CURVE, PROLOGUE } from '../constants.js'

/**
 * Create a new initiator that will respond to a challenge and confirm responder's identity
 * @param {object} config
 * @param {KeyPair} config.keypair
 * @param {Buffer} config.responderPublicKey
 * @param {Buffer} config.challenge
 * @param {Curve } [config.curve]
 * @param {object} [config.initiatorMetadata]
 */
export const createInitiatior = ({
  keypair,
  responderPublicKey,
  challenge,
  curve,
  initiatorMetadata
}) => {
  const handshake = createHandshake('IK', true, keypair, {
    curve: curve || DEFAULT_CURVE
  })

  handshake.initialise(PROLOGUE, responderPublicKey)

  let attestation
  try {
    attestation = Buffer.from(
      handshake.send(
        Buffer.concat([
          challenge,
          initiatorMetadata
            ? Buffer.from(JSON.stringify(initiatorMetadata))
            : Buffer.alloc(0)
        ])
      )
    )
  } catch (error) {
    throw new Error(
      "Responder's keypair were generated using a different curve"
    )
  }

  /**
   * @param {Buffer} responderAttestation
   * @returns {{
   *  responderPublicKey: string,
   *  responderMetadata?: Object
   * }}
   */
  const verify = (responderAttestation) => {
    const result = JSON.parse(handshake.recv(responderAttestation).toString())
    try {
      result.responderMetadata = JSON.parse(result.responderMetadata)
    } catch (error) {
      delete result.responderMetadata
    }

    return result
  }

  return {
    /** Initiator's attestation to the challenge */
    attestation,
    /**  Verify responder's attestation and get the payload including metdata */
    verify
  }
}

/** @typedef {import("../interfaces").KeyPair} KeyPair */
/** @typedef {import("../interfaces").Curve} Curve */
