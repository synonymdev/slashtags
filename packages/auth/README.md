# Slashtags Accounts

> Bidirectional authentication of DIDs over slashtags-rpc

## Install

```bash
npm i @synonymdev/slashtags-auth @synonymdev/slashtags-rpc
```

## Usage

### Setup

```javascript
import { RPC } from '@synonymdev/slashtags-rpc';
import { Actions } from '@synonymdev/slashtags-actions';

// Node environment
const node = await RPC();
// Browser environment
// Use a community DHT relay or run your own https://github.com/hyperswarm/dht-relay
const node = await RPC({ relays: ['ws://trusted.dht-relay.instance.com'] });
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
