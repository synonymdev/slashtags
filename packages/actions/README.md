# Slashtags Actions

> Packaged handlers for Slashtag actions.

## Usage

```javascript
import { Core as Slashtags } from '@slashtag/core';

// Instantiate a slashtags
const node = await Slashtags();

const slashActs = SlashActions({ node });

await slashActs.handle(url, {
  ACT_1: {
    onChallenge: ({}) => {
      return { metadata, keyPair };
    },
    onSuccess: (stuff) => {
      console.log('success', stuff);
    },
    onError: (err) => {
      console.log('got error', err);
    },
  },
});
```
