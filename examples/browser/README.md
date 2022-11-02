# Browser example

Demonstrates the SDK's usage in the browser.

## Usage


First you need to run a relay:

```bash
npm i -g @synonymdev/slashtags-cli

slash daemon start
```

Make sure to change to this dir:

```bash
cd examples/browser
```

Install node dependencies:

```bash
npm install
```

Then start serving the simple html:

```bash
npm start
```

Open this app in your browser (http://localhost:8002/)

Finally check your browser console, you should see:

```
{ alice: 'slash:9shucowxq7gikckzeij1qnpmazexzst5cg9x75fd9fmu6nc8t4gy' }
Announcing Alice's public drive...
{ bob: 'slash:c8yh4sd3afowb55onrbxfjg4aiadcr115xqjok54prc5urasor7y' }
Resolving Alice's public drive...
Profile: { name: 'Alice' }
```
