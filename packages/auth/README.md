# Slashtags Auth

> Bidirectional authentication for keypair verification through attestation.

## Overview

Slashtags Auth follows few steps:

- **Request**

  An **Initiator** (client or a peer) sends a request to a server or another peer.

- **Responder**
  Sends back the following:

  - Public key: the responder's public key.
  - Challenge: curve name + random bytes.

  encoded with a varint for the Slashtags Auth version.

- **Route to key manager (optional)**

  In case the (client or peer) doesn't manage the keypair, it should prepare a Slashtags Action's and send it to the wallet or key manager, see the Slashtags Actions's Integration below.

- **Initiator Attestation**

  The **Initiator** signs the challenge (or get the attestation from a key manager) and send it back encoded with the Version Code, and the source of the attestation, in this case (Initiator).

- **Responder verification**

  Responder verifies the initiator's attestation, and sends back its own attestation along with optional metadata.

- **Initiator verification**

  Initiator verifies the responder's attestation to ensure bidirectional authentication.

## Usage

```js
import { createAuth } from '@synonymdev/slashtags-auth';
import { secp256k1 } from 'noise-curve-secp256k1';

// === Responder's Side ===
const responderKeypair = secp256k1.generateKeyPair();
const responder = createAuth(responderKeypair, {
  metadata: { foo: 'responder' },
});

// Generate a new challenge and track session's timeout
const challenge = responder.newChallenge(100);

// === Initiator's Side ===
// Pass the challenge to the initiator
const initiatorKeypair = secp256k1.generateKeyPair();
const initiator = createAuth(initiatorKeypair, {
  metadata: { foo: 'intitiator' },
});
const initiatorAttestation = initiator.signChallenge(challenge);

// === Responder's Side ===
// Pass the attestation to the responder
const resultResponder = responder.verify(initiatorAttestation);
// resultResponder => {
//  as: 'Responder',
//  intitiatorPK: Uint8Array[...],
//  metadata: { foo: 'initiator' },
//  responderAttestation: Uint8Array[...]
// }

// === Initiator's Side ===
// Finally pass the responder attestation to the initiator
const resultInitiator = initiator.verify(resultResponder.responderAttestation);
// resultInitiator => {
//  as: 'Initiator',
//  metadata: { foo: 'responder' },
//  responderPK: Uint8Array[...]
//}
```

## Eliptic Curves

By default the library uses the `secp256k1` curve.

Both the initiator and the responder keypairs needs to use the same curve.

## Slashtags Actions integration

TODO: explain how Slashtags Actions fit in Slashtags Auth's flow.
