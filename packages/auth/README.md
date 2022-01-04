# Slashtags Accounts

> Bidirectional authentication of DIDs over slashtags-rpc

## Install

```bash
npm i @synonymdev/slashtags-auth @synonymdev/slashtags-rpc
```

## Usage

### Setup

```javascript
import { Core } from '@synonymdev/slashtags-core';
import { Auth } from '@synonymdev/slashtags-auth';

// Node environment
const node = await Core();
// Browser environment
// Use a community DHT relay or run your own https://github.com/hyperswarm/dht-relay
const node = await Core({
  rpc: { relays: ['ws://trusted.dht-relay.instance.com'] },
});

// Initialize the auth module using the Slashtags node
const auth = await Auth(node);
```

### Issuing a new url for auth session

```javascript
auth.issueURL({
  // Do something when url expires (optional)
  onTimeout: () => {},
  onRequest: () => ({
    responder: {
      keyPair, // {publicKey, secretKey}
      profile, // A Thing (see schema.org)
    },
    // Optional additional items to be sent to the user _before_ authentication
    additionalItems: [],
  }),
  onVerify: (
    profile, // Initiator's profile
    additionalItems, // Optional additionalItems from the Initiator
  ) => {
    // Do something with authenticated user information

    return {
      status: 'OK',
      // Optional additional items to be sent to the user _after_ authentication
      additionalItems: [],
    };
  },
});
```
