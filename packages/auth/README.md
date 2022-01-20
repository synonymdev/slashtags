# Slashtags Accounts

> Bidirectional authentication of DIDs over slashtags-core

## Install

```bash
npm i @synonymdev/slashtags-auth @synonymdev/slashtags-core
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
  relays: ['ws://trusted.dht-relay.instance.com'],
});

// Initialize the auth module using the Slashtags node
const auth = await Auth(node);
```

### Issuing a new url for auth session

```javascript
const url = auth.issueURL({
  // Do something when url expires (optional)
  onTimeout: () => {},
  onRequest: () => ({
    // Declare the keyPair and profile of the responder
    responder: {
      keyPair, // {publicKey, secretKey}
      profile, // A Thing (see schema.org)
    },
    // Optional additional items to be sent to the user _before_ authentication
    additionalItems: [],
  }),
  onSuccess: (
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
