import {
  didKeyFromPubKey,
  createJWS,
  signers,
  sessionFingerprint
} from '@synonymdev/slashtags-auth'

/** @type {ActionImplementation} */
export const ACT1 = async ({ node, address, callbacks, tkt, verify }) => {
  const response = await node.request(address, 'ACT1_INIT', { tkt })

  /** @type {{proof: string, profile: Profile, additionalItems: JsonLdObject[]}} */
  // @ts-ignore
  const {
    proof,
    profile: responder,
    additionalItems: responderAdditionalItems
  } = response.body

  /** @type {{sfp: string}} */
  const payload = await verify(proof, responder['@id'])

  const sfp = await sessionFingerprint(response, tkt)
  if (payload.sfp !== sfp) throw new Error('InvalidSessionFingerprint')

  /** @type {ACT1_InitialResponseResult} */
  const promptAnswer = await callbacks.onResponse?.(
    responder,
    responderAdditionalItems
  )

  // User didn't reject authentication prompt
  if (promptAnswer) {
    const initiator = promptAnswer.initiator
    const local = initiator.profile

    if (!local['@id']) {
      local['@id'] = didKeyFromPubKey(initiator.keyPair.publicKey)
    }

    const jws = await createJWS(
      { sfp },
      signers[initiator.keyPairType || 'ES256K'](initiator.keyPair.secretKey)
    )

    const verifiedResponse = await node.request(address, 'ACT1_VERIFY', {
      jws,
      tkt,
      profile: local,
      // @ts-ignore
      additionalItems: promptAnswer.additionalItems
    })

    callbacks.onSuccess?.(
      { local, remote: responder },
      // @ts-ignore
      verifiedResponse?.body?.additionalItems
    )
  }
}

/** @typedef {import ('../interfaces').ACT1_Callbacks} CallBacks */
/** @typedef {import ('../interfaces').ActionImplementation } ActionImplementation */
/** @typedef {import ('../interfaces').ACT1_InitialResponseResult} ACT1_InitialResponseResult */
/** @typedef {import ('@synonymdev/slashtags-auth').Profile} Profile */
/** @typedef {import ('@synonymdev/slashtags-common').JsonLdObject} JsonLdObject */
