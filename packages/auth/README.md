# Slashtags Auth

> Bidirectional authentication for keypair verification through attestation.

JS implementation of Slashtags Auth.

## Usage

```js
import { createAuth } from '@synonymdev/slashtags-auth';
import { secp256k1 } from 'noise-curve-tiny-secp';

// === Responder's Side ===
const responderKeypair = secp256k1.generateKeyPair();
const { responder } = createAuth(responderKeypair, {
  metadata: { foo: 'responder' },
});

// Generate a new challenge and track session's timeout
const challenge = responder.newChallenge(
  100,
  // optional metdata per session
  { foo: 'responder-override' },
);

// === Initiator's Side ===
// Pass the challenge to the initiator
const initiatorKeypair = secp256k1.generateKeyPair();
const { initiator } = createAuth(initiatorKeypair, {
  metadata: { foo: 'intitiator' },
});
const { attestation, verifyResponder } = initiator.signChallenge(
  responderKeypair.publickey,
  challenge,
  // optional metdata per session
  { foo: 'initiator-override' },
);

// === Responder's Side ===
// Pass the attestation to the responder
const resultResponder = responder.verifyInitiator(attestation);
// resultResponder => {
//  intitiatorPK: Uint8Array[...],
//  metadata: { foo: 'initiator-override' },
//  responderAttestation: Uint8Array[...]
// }

// === Initiator's Side ===
// Finally pass the responder attestation to the initiator
const resultInitiator = verifyResponder(resultResponder.responderAttestation);
// resultInitiator => {
//  metadata: { foo: 'responder-override' },
//  responderPK: Uint8Array[...]
//}
```

## Eliptic Curves

By default the library uses the `secp256k1` curve.

Both the initiator and the responder keypairs needs to use the same curve.

## Slashtags Actions integration

In the case of a client-server app, it is very likely that the private keys are managed by an external wallet, that is where Slashtags Actions comes in, to format the challenge and a callback url to which the wallet should submit the attestation.

```js
// In wallet
const { initiator } = createAuth(userKeyPair, {
  metadata: { preferred_name: 'foo' },
});

const handleIncomingActions = async (url) => {
  const { actionID, payload } = SlashtagsURL.parse(url);

  switch (actionID) {
    // Slashtags Auth action
    case 'b2iaqaamaaqjcbw5htiftuksya3xkgxzzhrqwz4qtk6oxn7u74l23t2fthlnx3ked':
      logOnScreen('Sign in to server: ' + payload.remotePK);

      // Sing the challenge to generate the attestation
      const { attestation, verifyResponder } = initiator.signChallenge(
        Buffer.from(payload.remotePK, 'hex'),
        Buffer.from(payload.challenge, 'hex'),
      );

      // Send attestation to cbURL
      const url = new URL(payload.cbURL);
      url.searchParams.set(
        'attestation',
        Buffer.from(attestation).toString('hex'),
      );
      const res = await fetch(url.toString());
      const { responderAttestation } = await res.json();

      // Verify
      const { responderPK, metadata } = verifyResponder(
        Buffer.from(responderAttestation, 'hex'),
      );

      logOnScreen('Authed to: ', Buffer.from(responderPK).toString('hex'));
      logOnScreen('metadata: ', metadata);

      break;
    case 'b2...xyz':
      // Other action
      // doSomethingElse();
      break;
    default:
      // If it reached here without throwing an "Unknown slashtags action: .." error
      console.log('Not an action');
      return;
  }
};
```
