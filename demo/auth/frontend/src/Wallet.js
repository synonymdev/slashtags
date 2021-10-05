// @ts-nocheck
// Separate from the client side, provides key management and attestation.
import { createAuth } from '@synonymdev/slashtags-auth';
import { secp256k1 as curve } from 'noise-curve-tiny-secp';
import * as SlashtagsURL from '@synonymdev/slashtags-url';
import { useState, useEffect } from 'react';
import bint from 'bint8array';
import Form from '@rjsf/core';

// Alreayd in the wallet
/** @type {string} */
let username;
/** @type {import('@synonymdev/slashtags-auth/dist/types/interfaces').KeyPair} */
let userKeyPair;
/** @type {import('@synonymdev/slashtags-auth/dist/types/interfaces').Initiator} */
let initiator;

const Service = ({ service, pk, toAccount }) => {
  return (
    <div className="service" onClick={toAccount}>
      <img src={service.logo}></img>
      <h2>{service.name}</h2>
      <pre>{pk}</pre>
    </div>
  );
};

/**
 *
 * @param {object} param
 * @param {string} param.actionURL
 * @returns
 */
export const Wallet = ({ actionURL, username }) => {
  const [authPayload, setAuthPayload] = useState();
  const [server, setServer] = useState(false);
  const [account, setAccount] = useState(false);

  userKeyPair = curve.generateSeedKeyPair(username);

  const { initiator } = createAuth(userKeyPair, {
    metadata: {
      name: username,
      image: 'www.example.com/image.png',
    },
  });

  const signIn = async () => {
    const { attestation, verifyResponder } = initiator.respond(
      bint.fromString(authPayload.pubKey, 'hex'),
      bint.fromString(authPayload.challenge, 'hex'),
    );

    const url = new URL(authPayload.cbURL);
    const res = await fetch(url.toString(), {
      method: 'POST',
      body: JSON.stringify({
        attestation: Buffer.from(attestation).toString('hex'),
      }),
      headers: { 'Content-type': 'application/json; charset=UTF-8' },
    });
    const { responderAttestation } = await res.json();

    const { responderPK, metadata } = verifyResponder(
      Buffer.from(responderAttestation, 'hex'),
    );

    setAuthPayload(null);
    setServer({
      verified: true,
      metadata,
      responderPK: Buffer.from(responderPK).toString('hex'),
    });
  };

  useEffect(() => {
    // Handle incoming action urls
    (async () => {
      if (!actionURL) return;

      try {
        const { actionID, payload } = SlashtagsURL.parse(actionURL);

        switch (actionID) {
          case 'b2iaqaamaaqjcaxryobe4ygqqs3cksu74j4rhzpr7kk3lndqg7gim72edpiagor3z':
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

  const getAccount = async ({ account, name }) => {
    if (!account) return;
    const res = await (await fetch(account)).json();
    console.log(res);
    setAccount({
      name,
      ...res,
    });
  };

  return (
    <div className="container">
      <h1>Wallet</h1>
      <div id="wallet">
        {account ? (
          <>
            <h4>{account.name}</h4>
            <Form schema={account.schema} formData={account.data} />
            <button className="btn" onClick={() => setAccount(false)}>
              {'< Back'}
            </button>
          </>
        ) : (
          <>
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
                <pre>{authPayload.pubKey}</pre>
                <p>by signing their challenge</p>
                <pre>{authPayload.challenge}</pre>
                <button className="btn signin" onClick={signIn}>
                  Sign in
                </button>
              </>
            )}
            {server?.verified && (
              <>
                <h3>Successfully logged in to</h3>
                <pre>{server.responderPK}</pre>
                <Service
                  service={server.metadata.service}
                  pk={server.responderPK}
                  toAccount={() => getAccount(server.metadata.service)}
                />
                <button className="btn" onClick={() => setServer(false)}>
                  {'< Back'}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
