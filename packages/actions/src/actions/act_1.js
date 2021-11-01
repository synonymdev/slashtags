import { memoizedCreateAuth } from '../utils.js'
import bint from 'bint8array'

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
    /** @type {{metadata: Metadata, publicKey: string, challenge:string}} */
    // @ts-ignore
    const response = await node.request(address, 'ACT_1/GET_CHALLENGE', {
      ticket: tkt
    })

    // @ts-ignore
    if (response.code < 0) throw new Error(response.message)

    // TODO: defrentiate between Accounts and Contacts?
    const promptResponse = await callbacks.onChallenge?.(response)

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

    const { keyPair: initiatorKeyPair, metadata: intitiatorMetadata } =
      promptResponse

    const auth = memoizedCreateAuth(initiatorKeyPair, intitiatorMetadata)

    const { attestation, verifyResponder } = auth.initiator.respond(
      bint.fromString(response.publicKey, 'hex'),
      bint.fromString(response.challenge, 'hex')
    )

    const answer = await node.request(address, 'ACT_1/RESPOND', {
      attestation: bint.toString(attestation, 'hex'),
      ticket: tkt
    })

    // @ts-ignore
    if (answer.code < 0) throw new Error(answer.message)

    /** @type {{attestation: string}} */
    // @ts-ignore
    const { attestation: responderAttestation } = answer

    // @ts-ignore
    const { responderPK, metadata } = verifyResponder(
      bint.fromString(responderAttestation, 'hex')
    )

    callbacks.onSuccess?.({
      responder: {
        publicKey: responderPK,
        // @ts-ignore
        metadata
      },
      initiator: {
        publicKey: initiatorKeyPair.publicKey,
        metadata: intitiatorMetadata
      }
    })

    return { status: 'OK', act, tkt, address }
  } catch (error) {
    callbacks.onError?.(error)
    return { status: 'ERROR', error, address, act, tkt }
  }
}

/** @typedef {import ('../interfaces').ACT_1Callbacks} CallBacks */
/** @typedef {import ('../interfaces').Metadata} Metadata */
/** @typedef {import ('@synonymdev/slashtags-core').SlashtagsAPI} SlashtagsAPI */
