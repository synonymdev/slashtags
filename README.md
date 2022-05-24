<p align="center">
  <a href="https://github.com/synonymdev/slashtags" title="Slashtags">
    <img alt="slashtags" src="./docs/_img/slashtags-logo.png" width="150"></img>
  </a>
</p>

<h3 align="center">JavaScript implementation of the Slashtags protocol</h3>

---

**⚠️ This is still in alpha. Please use at your own risk.⚠️**

---

## Overview

Slashtags aims to enable self-sovereign identity, reputation and web-of-trust on the web.

### The problem

IPs (Internet Protocol address) identifies where your machine exists both geographically and topologically. But you yourself (or your machine for that matter) can't be identified or addressed regardless of its location or the network it is using.

So the Web became a network of mediators and service providers that you have to be tethered to one of them to be addressed or identified. Giving rise to censorship, surveillance and vendor-lock problems the latest of which slowed down the rate of innovation significantly.

### Slashtag's solution

Slashtags solution is to use keyPairs to identify and address peers and attach metadata about them, giving rise to reputation, and private yet interoperable webs-of-trust.

### How it works

A [Slashtag](./packages/slashtag/README.md) is a keyPair indirectly [derived](./specs/slashtags-key-derivation.md) from the same seed that backs up your digital assets.

You can publish metadata about your Slashtag using [SlashDrive](./packages/drive/README.md) identified by the same public key, for anyone to read.

That is deceivingly simple, but very powerful. For example you can publish your current Email address, Website URL, Twitter handle, Facebook profile, etc. And your contacts who identify you through a Slashtags compatible wallet can always find and reach you, making your identity and reputation censorship resistant.

But you can also directly contact a Slashtag owner if they are listening on their public key, independently from their IP address, thanks to [Hyperswarm](https://github.com/hyperswarm/hyperswarm)'s Distributed Hash Table (DHT).

Slashtags can also create private encrypted drives and share it with one or many peers, serving as either a private feed, or a one-to-one asynchronous communication channel.

### Next steps

We realize the existing primitives are not enough on their own to give rise to a web-of-trust and a scalable digital economy that can't be held hostage to the same problems as the current one.

But we will build applications that demonstrate that future, to learn what is missing, and build the missing parts as we go.

## Installation

```bash
npm install @synonymdev/slashtags-sdk
```

Then start a node in your app:

```javascript
import { SDK } from '@synonymdev/slashtags-sdk';

const sdk = await SDK.init();
const alice = sdk.slashtag({ name: 'alice' });

console.log(alice.url.toString());
// slash://abc...xyz
```

## Documentation

Documentation is a still work in progress. But you can start by reading the available [specs](./specs/), check out the [examples](./examples/) and read through the API documentation of any package in its README.md.

## Examples

Run `npm install` in the root directory first.

Look into the [examples](./examples/) to learn how to see Slashtags in action.

## Structure

This project is broken into several modules, their purposes are:

- [`/packages/drive`](./packages/drive): Object-storage built over Hypercore.
- [`/packages/slashtag`](./packages/slashtag): Identity layer of Slashtags protocol.
- [`/packages/auth`](./packages/auth): Authorization using Slashtags.
- [`/packages/sdk`](./packages/sdk): Batteries-included Software development kit.

## Development

Requires Node LTS (v16.5.0).
[nvm](https://github.com/nvm-sh/nvm#intro) is suppported but not required

```
npm install
```

### Testing

Make sure you have a running testnet, by running `testnet:start`. Once you are done you can close it by running `testnet:close`.
