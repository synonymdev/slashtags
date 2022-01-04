# Slashtags Actions

> Packaged handlers for Slashtags actions.

## Install

```bash
npm i @synonymdev/slashtags-actions @synonymdev/slashtags-rpc
```

## Usage

### Setup

```javascript
import { Core } from '@synonymdev/slashtags-core';
import { Actions } from '@synonymdev/slashtags-actions';

// Node environment
const node = await Core();
// Browser environment
// Use a community DHT relay or run your own https://github.com/hyperswarm/dht-relay
const node = await Core({
  rpc: { relays: ['ws://trusted.dht-relay.instance.com'] },
});

// Initialize the actions module using the Slashtags node
const actions = Actions(node);
```

### Handle action urls

```javascript
// Instantiate a slashtags
await actions.handle(
  scannedURL,
  {
    ACT1: {
      onResponse: (
        profile, // Responder's profile
        additionalItems, // Optional additionalItems from the authenticated Responder
      ) => {
        // Optionally Prompt the user to confirm the action,
        //  and choose what persona to use for authentication

        return {
          initiator: {
            keyPair, // {publicKey, secretKey}
            profile, // Initiator's profile A Thing (see schema.org)
          },
          // Optional additional items to be sent to the user _before_ authentication
          additionalItems: [],
        };
      },
      onSuccess: (
        connection // {local: Initiator's profile, remote: Resopnder's profile}
        additionalItems, // Optional additionalItems from the Responder _after_ authenticating the Initiator
        ) => {},
    },
  },
  (error) => {
    // Do something with unexpected erros (display in UI for example)
  },
);
```
