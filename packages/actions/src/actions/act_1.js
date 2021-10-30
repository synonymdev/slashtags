import { memoizedCreateAuth } from '../utils.js'

/**
 * @param {object} params
 * @param {SlashtagsAPI} params.node
 * @param {string} params.address
 * @param {CallBacks} params.callbacks
 * @param {string} params.act,
 * @param {string} params.tkt,
 * @returns
 */
export const ACT_1 = async ({ node, address, callbacks, act, tkt }) => {
  try {
    /** @type {{metadata: Metadata,publicKey: string, challenge:string}} */
    // @ts-ignore
    const { challenge, publicKey, metadata } = await node.request(
      address,
      'ACT_1/GET_CHALLENGE',
      {
        ticket: tkt
      }
    )

    const promptResponse = await callbacks?.[act]?.onChallenge({
      publicKey,
      metadata
    })

    // User rejected authentication prompt
    if (!promptResponse) {
      return {
        status: 'SKIP',
        reason: 'User rejected prompt',
        act,
        tkt,
        address
      }
    }

    const { keyPair, metadata: localMetadata } = promptResponse

    const auth = memoizedCreateAuth(keyPair, localMetadata)

    const { attestation, verifyResponder } = auth.initiator.respond(
      Buffer.from(publicKey, 'hex'),
      Buffer.from(challenge, 'hex')
    )

    const answer = await node.request(address, 'ACT_1/RESPOND', {
      attestation: Buffer.from(attestation).toString('hex'),
      ticket: tkt
    })

    // @ts-ignore
    if (answer.code < 0) return { status: 'Error', ...answer }

    /** @type {{attestation: string}} */
    // @ts-ignore
    const { attestation: responderAttestation } = answer

    const verifiedResponderMetadataAndPK = verifyResponder(
      Buffer.from(responderAttestation, 'hex')
    )

    callbacks?.[act]?.onSuccess?.(verifiedResponderMetadataAndPK)

    return { status: 'OK', act, tkt, address }
  } catch (error) {
    callbacks?.[act]?.onError?.(error)
    return { status: 'ERROR', error, address, act, tkt }
  }
}

/** @typedef {import ('../interfaces').CallBacks} CallBacks */
/** @typedef {import ('../interfaces').Metadata} Metadata */
/** @typedef {import ('@synonymdev/slashtags-core').SlashtagsAPI} SlashtagsAPI */
