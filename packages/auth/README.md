# Slashtags Auth

> Bidirectional authentication for keypair verification.

## Usage

```js
import { createChallenger, createInitiatior } from './index.js';
import secp256k1 from 'noise-curve-secp';

// Create a challenger to manage sessions
const challengerKeypair = secp256k1.generateKeyPair();
const challenger = createChallenger({
  keypair: challengerKeypair,
  metadata: Buffer.from(JSON.stringify({ description: 'challenger' })),
});
const { challenge } = challenger.newChallenge(100);

// Pass the challenge to the initiator somehow
const initiatorKeypair = secp256k1.generateKeyPair();
const initiator = createInitiatior({
  keypair: initiatorKeypair,
  challengerPublicKey: challengerKeypair.publicKey,
  challenge: challenge,
  initiatorMetadata: Buffer.from(JSON.stringify({ name: 'foo' })),
});

// Pass the response to the challenger
const {
  // Get the initiator metadata (buffer)
  initiatorMetadata, //=> Buffer.from("{\"name\":\"foo\"}")
  // Prepare a response fro bidirectional authentication (buffer)
  challengerResponse,
} = challenger.verify(initiator.response);

// Finally pass the challenger response to the initiator
const challengerResponesData = initiator.verify(challengerResponse);
/*=> 
{
  // JSON stringified
  ChallengerMetadata: "{\"description\":\"challenger\"}", 
  // Multibase encoded buffer
  publicKey: "uIMrT1tFHtsvbPSImfEpRyr-SgLmi2cCvBOhYQwl2hBqzFY4IOZT0otX-BcutcNX83KmNyjBWuKgamQti3YBVNw", 
};
*/
```

## Eliptic Curves

By defualt the library uses the `secp256k1` curve.

Currently both the initiator and the challenger keypairs needs to use the same curve.
