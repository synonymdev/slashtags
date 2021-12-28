import {
  verifyJWS,
  didKeyFromPubKey,
  createJWS,
  signers,
  sessionFingerprint
} from '@synonymdev/slashtags-auth'

/**
 * @param {object} params
 * @param {SlashtagsRPC} params.node
 * @param {Uint8Array} params.address
 * @param {CallBacks} params.callbacks
 * @param {string} params.tkt
 * @param {import('did-resolver').Resolver} params.resolver
 * @param {string[]} params.supportedMethods
 * @returns
 */
export const ACT1 = async ({
  node,
  address,
  callbacks,
  tkt,
  resolver,
  supportedMethods
}) => {
  const response = await node.request(address, 'ACT1_INIT', { tkt })

  const sfp = await sessionFingerprint(response, tkt)

  /** @type {{peer: Peer, sfp: string }} */
  // @ts-ignore
  const payload = await verifyJWS(response.body, resolver, supportedMethods)
  const remote = payload.peer

  if (payload.sfp !== sfp) throw new Error('InvalidSessionFingerprint')

  const promptResponse = await callbacks.onRemoteVerified?.(remote)

  // User rejected authentication prompt
  if (promptResponse) {
    const id = didKeyFromPubKey(promptResponse.signer.keyPair.publicKey)

    const local = {
      '@id': id,
      // @ts-ignore
      ...promptResponse.metadata
    }

    const jws = await createJWS(
      {
        peer: local,
        sfp
      },
      signers[promptResponse.signer.type || 'ES256K'](
        promptResponse.signer.keyPair.secretKey
      )
    )

    const verifiedResponse = await node.request(address, 'ACT1_VERIFY', {
      jws,
      tkt
    })

    callbacks.onLocalVerified?.({
      local,
      remote,
      // @ts-ignore
      feeds: verifiedResponse?.body?.feeds
    })
  }
}

/** @typedef {import ('../interfaces').ACT1_Callbacks} CallBacks */
/** @typedef {import ('@synonymdev/slashtags-rpc').SlashtagsRPC} SlashtagsRPC */
/** @typedef {import ('@synonymdev/slashtags-auth').Peer} Peer */
