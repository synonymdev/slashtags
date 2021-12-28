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
  respondAs: { signer: { keyPair, type: 'ES256K' }, metadata },
  onTimeout: () => {},
  onVerify: (user) => {
    // Do something with user information

    return {
      status: 'OK',
      feeds: [
        // TODO: update documentation for feeds
        // Feeds
      ],
    };
  },
});
```
