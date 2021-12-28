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
      onRemoteVerified: async (peer) => {
        // Return the metadat and signer information after user prompting
        return {
          metadata,
          signer: {
            keyPair,
            type: 'ES256K',
          },
        };

        // Or return false if user rejected authenticating to the remote peer
        return false;
      },
      onLocalVerified: ({ local, remote }) => {
        // Use the remote peer (server or contact), and the local peer (profile used to auth) data as you see fit.
      },
    },
  },
  (error) => {
    // display errors in UI
  },
);
```
