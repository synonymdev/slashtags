# Slashtags URL

> Slashtags url utilities for documents and actions

## Documents URLs

Document URLs are used for addressing documents by their DocID

Document URL consists of the follwing

```js
<slashtags-docurl> ::= slashtags://docID/[path][?query][#fragment]
```

## Action URLs

Action URLs on the other hand are used to encode a predefined action and its payload.

The first example is the payload for SlashtagsAuth enabled wallets to sign a challenge and send it to a callback url

Action URL consists of the follwing

```js
<slashtags-docurl> ::= slashtags:[actionID][#payload]
```

For simplicity, Actions are identfied by the encoded string of their DocID, and that is how they should be addressed in the spec when a new action is added.

## Usage

Most common use will be parsing an incoming action url

```js
import * as SlashtagsURL from '@synonymdev/slashtags-url';

const handleAction = (actionID, paylaod) => {
  switch (actionID) {
    case 'bi...xyz':
      doSomething(payload);
      break;
    default:
      return;
  }
};

const { actionID, payload } = SlashtagsURL.parse(url);

handleAction(actionID, payload);
```

Formatting an action url

```js
const actionID = 'b2..xyz';
const payload = { foo: 'bar' };

SlashtagsURL.format(actionID, payload);
// slashtags:b2iaqaamaaqjcaqv6g7ndzg7umksak37wip66r7nqoyuutg5re2y3hoc7cv3ytoby/#ugAR7ImNoYWxsZW5nZSI6ImZvbyIsImNiVVJMIjoiaHR0cHM6d3d3LmV4YW1wbGUuY29tIn0
```

If you need to add more actions that are not available out of the box

```js
SlashtagsURL.addAction(schema);
```

Formatting a document url

```js
SlashtagsURL.format(docID);
// slashtags://b2iaqaamaaqjcaqv6g7ndzg7umksak37wip66r7nqoyuutg5re2y3hoc7cv3ytoby/
```
