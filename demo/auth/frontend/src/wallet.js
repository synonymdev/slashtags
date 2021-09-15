// Separate from the client side, provides key management and attestation.
import { createAuth } from '@synonymdev/slashtags-auth';
import { secp256k1 as curve } from 'noise-curve-tiny-secp';
import * as SlashtagsURL from '@synonymdev/slashtags-url';

// Alreayd in the wallet
let userKeyPair;

export const setUser = (seed) => {
  userKeyPair = curve.generateSeedKeyPair(seed);
};

export const getPublicKey = () => userKeyPair.publicKey.toString('hex');

// What wallets need to implement
export const attest = async ({ slashtagsAction }) => {
  const { actionID, payload } = SlashtagsURL.parse(slashtagsAction);
  if (
    actionID !==
    'b2iaqaamaaqjcbw5htiftuksya3xkgxzzhrqwz4qtk6oxn7u74l23t2fthlnx3ked'
  )
    throw new Error('Not stAction Auth');

  const { challenge, cbURL } = payload;

  const auth = createAuth(userKeyPair, {
    metadata: 'Client Wallet Server configuration',
  });

  const initiatorAttestation = auth.signChallenge(
    Buffer.from(challenge, 'hex'),
  );

  let response;
  try {
    response = await fetch(
      cbURL +
        '?&attestation=' +
        Buffer.from(initiatorAttestation).toString('hex'),
    );
  } catch (error) {
    // Mostly a timeout or an already authenticated user.
    // Show the user something went wrong.
    console.log(error);
  }

  if (response.ok) {
    response = await response.json();
  } else {
    return;
  }

  try {
    const final = auth.verify(
      Buffer.from(response.responderAttestation, 'hex'),
    );
    if (final.as === 'Initiator')
      return {
        publickey: Buffer.from(final.responderPK).toString('hex'),
        metadata: final.metadata,
      };

    return;
  } catch (error) {
    console.log(error);
  }
};
