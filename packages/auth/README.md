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
const { attestation, verifyResponder } = initiator.respond(
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

## Elliptic Curves

By default the library uses the `secp256k1` curve.

Both the initiator and the responder keypairs needs to use the same curve.
