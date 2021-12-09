import {
  verifyJWS,
  didKeyFromPubKey,
  createJWS,
  signers,
  sessionFingerprint,
} from '@synonymdev/slashtags-auth';

/**
 * @param {object} params
 * @param {SlashtagsRPC} params.node
 * @param {Uint8Array} params.address
 * @param {CallBacks} params.callbacks
 * @param {string} params.action
 * @param {string} [params.tkt]
 * @returns
 */
export const ACT_1 = async ({ node, address, callbacks, action, tkt }) => {
  if (!tkt) throw new Error('Missing param: tkt');

  const response = await node.request(address, 'ACT1_INIT', { tkt });

  // @ts-ignore
  const sfp = await sessionFingerprint(response, tkt);

  /** @type {{peer: Peer, sfp: string }} */
  // @ts-ignore
  const payload = await verifyJWS(response?.body);
  const remotePeer = payload.peer;

  if (payload.sfp !== sfp) return new Error('Invalid sesison fingerprint');

  const promptResponse = await callbacks.onInitialResponse?.(remotePeer);

  // User rejected authentication prompt
  if (promptResponse) {
    const id = didKeyFromPubKey(promptResponse.signer.keyPair.publicKey);

    const peer = {
      '@id': id,
      // @ts-ignore
      ...promptResponse.metadata,
    };

    const jws = await createJWS(
      {
        peer,
        sfp,
      },
      signers[promptResponse.signer.type || 'ES256K'](
        promptResponse.signer.keyPair.secretKey,
      ),
    );

    const verifiedResponse = await node.request(address, 'ACT1_VERIFY', {
      jws,
      tkt,
    });

    callbacks.onSuccess?.({
      peer,
      remotePeer,
      feeds: verifiedResponse?.body?.feeds,
    });
  }
};

/** @typedef {import ('../interfaces').ACT_1_Callbacks} CallBacks */
/** @typedef {import ('@synonymdev/slashtags-rpc').SlashtagsRPC} SlashtagsRPC */
/** @typedef {import ('@synonymdev/slashtags-auth').Peer} Peer */
