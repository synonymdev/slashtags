# Slashtags Auth

> Bidirectional authentication for keypair verification through attestation.

## Overview

- **Request**

  An Initiator (client or a peer) sends a request to a server or another peer.

- **Challenge**

  Responder sends back the following:

  - Challenge: curve name + random bytes.
  - Public key: the responder's public key.
  - attestationURL: which is where the responder expects to revieve the attestation and metadata.

- **Route to key manager (optional)**

  If the key manager (wallet) is separate from the initiator, then the initiator should pass the payload from above to the key manager using [Slashtags URI]() with the [Slashtags/Auth]() shcema or an equivilant QR code.

- **Initiator Attestation**

  The initiator (or the key manager) signs the challenge and send the attestation in a query param to the given attestationURL.

  ```js
  await fetch(`{attestationURL}/?attestation={inititor.attestation}`);
  ```

- **Responder verification**

  Responder verifies the initiator's attestation, and sends back its own attestation along with optional metadata.

- **Initiator verification**

  Initiator verifies the responder's attestation.

## Usage

```js
import { createResponder, createInitiatior } from './index.js';
import secp256k1 from 'noise-curve-secp';

// === Responder's Side ===
// Create a responder to manage sessions
const responderKeypair = secp256k1.generateKeyPair();
const responder = createResponder({
  keypair: responderKeypair,
  metadata: Buffer.from(JSON.stringify({ description: 'responder' })),
});
const { challenge, attestationURL, responderPublicKey } =
  responder.newChallenge(100);

// === Initiator's Side ===
const initiatorKeypair = secp256k1.generateKeyPair();
const initiator = createInitiatior({
  keypair: initiatorKeypair,
  responderPublicKey: responderPublicKey,
  challenge: challenge,
  initiatorMetadata: Buffer.from(JSON.stringify({ name: 'foo' })),
});
// Send the attestations to the responder and get the responder's attestation
// const responderAttestation = await fetch(
// `{attestationURL}/?attestation={initiator.attestation}`,
// );

// === Responder's Side ===
// Pass the attestation to the responder
const {
  initiatorMetadata, //=> Buffer.from("{\"name\":\"foo\"}")
  responderAttestation, // For bidirectional authentication (buffer)
} = responder.verify(initiator.attestation);

// === Initiator's Side ===
// Finally pass the responder attestation to the initiator
const responderPayload = initiator.verify(responderAttestation);
/*=>
{
  // JSON stringified
  responderMetadata: "{\"description\":\"responder\"}",
  // Multibase encoded buffer
  publicKey: "uIMrT1tFHtsvbPSImfEpRyr-SgLmi2cCvBOhYQwl2hBqzFY4IOZT0otX-BcutcNX83KmNyjBWuKgamQti3YBVNw",
};
*/
```

## Eliptic Curves

By defualt the library uses the `secp256k1` curve.

Currently both the initiator and the responder keypairs needs to use the same curve.
