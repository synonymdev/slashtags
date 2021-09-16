// @ts-nocheck
// Separate from the client side, provides key management and attestation.
import { createAuth } from '@synonymdev/slashtags-auth';
import { secp256k1 as curve } from 'noise-curve-tiny-secp';
import * as SlashtagsURL from '@synonymdev/slashtags-url';
import { useState, useEffect } from 'react';

// Alreayd in the wallet
let username;
let userKeyPair;

export const setUser = (seed) => {
  username = seed;
  userKeyPair = curve.generateSeedKeyPair(seed);
};

export const Wallet = ({ actionURL }) => {
  const [authPayload, setAuthPayload] = useState();
  const [success, setSuccess] = useState(false);

  const signIn = async () => {
    const auth = createAuth(userKeyPair, {
      metadata: { preferred_name: username },
    });

    const attestation = auth.signChallenge(
      Buffer.from(authPayload.challenge, 'hex'),
    );

    const url = new URL(authPayload.cbURL);
    url.searchParams.set(
      'attestation',
      Buffer.from(attestation).toString('hex'),
    );
    const res = await fetch(url.toString());
    const { responderAttestation } = await res.json();

    console.log({
      Buffer,
      attestation: responderAttestation,
      isBuffer: Buffer.isBuffer(Buffer.from(responderAttestation, 'hex')),
    });

    const final = auth.verify(Buffer.from(responderAttestation, 'hex'));

    const serverPK = Buffer.from(final.responderPK).toString('hex');

    // TODO: show that on screen and alert if pubkey doesn't match!
    console.log({
      ...final,
      serverPK,
    });

    if (responderAttestation) {
      setAuthPayload(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  useEffect(() => {
    // Handle incoming action urls
    (async () => {
      if (!actionURL) return;

      try {
        const { actionID, payload } = SlashtagsURL.parse(actionURL);

        switch (actionID) {
          case 'b2iaqaamaaqjcbw5htiftuksya3xkgxzzhrqwz4qtk6oxn7u74l23t2fthlnx3ked':
            setAuthPayload(payload);
            break;

          default:
            setAuthPayload(null);
            return;
        }
      } catch (error) {
        console.warn('invlaid actionURL url');
      }
    })();
  }, [actionURL]);

  return (
    <div className="container">
      <h1>Wallet</h1>
      <div id="wallet">
        <h4>Wallet owner:</h4>
        <p>Name: {username} </p>
        <br />
        <p>Public key:</p>
        <pre>{userKeyPair?.publicKey.toString('hex')}</pre>
        <br />
        <br />
        {authPayload && (
          <>
            <h3>Login request</h3>
            <p>Do you want to login to:</p>
            <pre>{authPayload.remotePK}</pre>
            <p>by signing their challenge</p>
            <pre>{authPayload.challenge}</pre>
            <button className="btn signin" onClick={signIn}>
              Sign in
            </button>
          </>
        )}
        {success && (
          <button className="btn" onClick={() => setSuccess(false)}>
            Successfully signed in{' '}
          </button>
        )}
      </div>
    </div>
  );
};
