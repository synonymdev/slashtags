# Browser example

Demonstrates the SDK's usage in the browser.

## Usage

First you need to run a relay:

```bash
npm i -g @synonymdev/slashtags-cli

slash daemon start
```

Then start serving the simple html:

```js
npm start
```

Finally check console, you should see:

```js
Alice slashtag URL: slash:<Alice's public key>
Announcing Alice's public drive...
Bob slashtag url: slash:<Bob's public key>
Resolving Alice's public drive...
Alice's profile as seen by Bob: { name: "Alice" }
```

