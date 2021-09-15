// @ts-nocheck
// Separate from the client side, provides key management and attestation.
import { createAuth } from '@synonymdev/slashtags-auth';
import { secp256k1 as curve } from 'noise-curve-tiny-secp';
import * as SlashtagsURL from '@synonymdev/slashtags-url';
import { useState, useEffect } from 'react';

// Alreayd in the wallet
let userKeyPair = curve.generateSeedKeyPair('');

export const setUser = (seed) => {
  userKeyPair = curve.generateSeedKeyPair(seed);
};

const handleStActions = async (url) => {
  const { actionID, payload } = SlashtagsURL.parse(url);

  switch (actionID) {
    case 'b2iaqaamaaqjcbw5htiftuksya3xkgxzzhrqwz4qtk6oxn7u74l23t2fthlnx3ked':
      const { challenge, cbURL } = payload;

      const auth = createAuth(userKeyPair, {
        metadata: 'Client Wallet Server configuration',
      });

      const initiatorAttestation = auth.signChallenge(
        Buffer.from(challenge, 'hex'),
      );

      const response = await fetch(
        cbURL +
          '?&attestation=' +
          Buffer.from(initiatorAttestation).toString('hex'),
      );

      const { responderAttestation } = await response.json();

      console.log({
        responderAttestation: Buffer.from(responderAttestation, 'hex'),
      });

      const final = auth.verify(Buffer.from(responderAttestation, 'hex'));

      if (final.as === 'Initiator')
        console.log({
          publickey: Buffer.from(final.responderPK).toString('hex'),
          metadata: final.metadata,
        });

      return;

    default:
      return;
  }
};

export const Wallet = ({ userKeyPair, stAction }) => {
  const [state, setState] = useState();

  useEffect(() => {
    try {
      setState(SlashtagsURL.parse(stAction));
    } catch (error) {
      console.log('invlaid stAction url');
    }
  }, [stAction]);

  useEffect(() => {
    (async () => {
      if (!stAction) return;

      try {
        const response = await handleStActions(stAction);
        console.log(response);
      } catch (error) {
        console.log(error);
      }
    })();
  }, [state, stAction, userKeyPair]);

  return (
    <div className="container">
      <h1>Wallet</h1>
      <div id="wallet">
        <h4>Wallet owner: {userKeyPair?.publicKey.toString('hex')}</h4>
      </div>
      {state && <div>{JSON.stringify(state)}</div>}
    </div>
  );
};
