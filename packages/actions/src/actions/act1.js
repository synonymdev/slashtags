import {
  didKeyFromPubKey,
  createJWS,
  signers,
  sessionFingerprint
} from '@synonymdev/slashtags-auth'

/** @type {ActionImplementation} */
export const ACT1 = async ({ node, address, callbacks, tkt, verify }) => {
  const response = await node.request(address, 'ACT1_INIT', { tkt })

  /** @type {{proof: string, profile: Profile, metadata: JsonLdObject[]}} */
  // @ts-ignore
  const { proof, profile: remote, metadata: initialMetadata } = response.body

  /** @type {{sfp: string}} */
  const payload = await verify(proof, remote['@id'])

  const sfp = await sessionFingerprint(response, tkt)
  if (payload.sfp !== sfp) throw new Error('InvalidSessionFingerprint')

  /** @type {ACT1_InitialResponseResult} */
  const promptResponse = await callbacks.onInitialResponse?.(
    remote,
    initialMetadata
  )

  // User didn't reject authentication prompt
  if (promptResponse) {
    const initiator = promptResponse.initiator
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
      metadata: promptResponse.metadata
    })

    callbacks.onConnection?.(
      {
        local,
        remote
      },
      // @ts-ignore
      verifiedResponse?.body?.metadata
    )
  }
}

/** @typedef {import ('../interfaces').ACT1_Callbacks} CallBacks */
/** @typedef {import ('../interfaces').ActionImplementation } ActionImplementation */
/** @typedef {import ('../interfaces').ACT1_InitialResponseResult} ACT1_InitialResponseResult */
/** @typedef {import ('@synonymdev/slashtags-auth').Profile} Profile */
/** @typedef {import ('@synonymdev/slashtags-common').JsonLdObject} JsonLdObject */
