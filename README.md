<p align="center">
  <a href="https://github.com/synonymdev/slashtags" title="Slashtags">
    <img alt="slashtags" src="./docs/_img/slashtags-logo.png" width="150"></img>
  </a>
</p>

<h3 align="center">JavaScript implementation of the Slashtags protocol</h3>

---

**⚠️ This SDK is still in beta. Please use at your own risk.⚠️**

---

## Overview

Slashtags aims to enable self-sovereign identity, local first applications, reputation and web-of-trust.

### The problem

IPs (Internet Protocol address) identifies where your machine exists both geographically and topologically. But you yourself (or your machine for that matter) can't be identified or addressed regardless of its location or the network it is using.

A [slashtag](./packages/slashtag/README.md) is a key pair [derived](./specs/slashtags-key-derivation.md) from a standard BIP-39 series of mnemonic words, which is also used to generate Bitcoin addresses in practically all modern hardware and software wallets. Typically slashtags are associated with [hyperdrives](./packages/drive/README.md), personal drives for storing data that can be shared within a peer to peer network.

### Slashtag's solution

Slashtags solution is to use keyPairs to identify and address peers and attach metadata about them, giving rise to reputation, and private yet interoperable webs-of-trust.

### How it works

As already mentioned, at the core of Slashtags is a special type of file drive called a hyperdrive. Each hyperdrive is associated with an ed25519 private-public keypair derived from a BIP-39 master node and a name for the drive. What is known as the discovery key is a blake2b hash value of the public key.

Hyperdrives can be discovered, read, and seeded by peers on a network. The group of peers that stores some or all of the drive’s data is known as its swarm.

Members of the swarm are tracked within a [Kademlia-based](https://pdos.csail.mit.edu/~petar/papers/maymounkov-kademlia-lncs.pdf) distributed hash table system on the basis of the hyperdrive’s discovery key. Connections with members of the swarm and DHT nodes are made on the basis of a highly robust UDP holepunching algorithm. The distributed hash table system is known as [Hyperswarm](https://github.com/hyperswarm/hyperswarm).

Only the owner of the private key for a hyperdrive can make changes to it. Yet, other peers in the network can read and seed the data, as long as they have the discovery key. So in order to share a particular hyperdrive with a peer, one just has to hand over its public key. Schemas for particular data types help ensure efficient data retrieval and resolution, as well as interoperability between applications.

Hyperdrive data can be retrieved from any peer within the swarm. Slashtags relies on a digital signature procedure to ensure that peers can always determine the latest state of a particular hyperdrive. Specifically, all data is added to hyperdrives via blocks. Adding a block, requires making a valid signature over the merkle root of all the hash values of the existing blocks and the new block. Only when a valid signature is given will the block be added to the hyperdrive.  

Hyperdrives are simple, yet powerful. For example, suppose that you created a profile with an e-mail address, website, twitter handle, and so on in a hyperdrive that you owned. Once you share the public key of the hyperdrive with a contact, they can always retrieve your latest contact information. No big tech company or authoritarian government can stop them. No company going out of business impacts easy data availability. This decentralized character can be extended to other types of data and features in applications.

While much of the power of Slashtags comes via these hyperdrives, the key pairs that can be generated with Slashtags also can have important utility on their own. Bi-lateral, peer to peer [authentication](https://github.com/synonymdev/slashtags-auth-demo) between a user and a server can, for example, be realized just on the basis of key pairs.


### Slashtags in action

The first showcase for Slashtags is the Bitkit wallet. The following features are powered by Slashtags: profiles, contacts, payment preferences, authentication, private feeds, and public feeds. Please consult our [website](https://synonym.to/products/#bitkit) and our [Github repository](https://github.com/synonymdev/bitkit) for more information. The website includes a [Playground](https://www.slashtags.to/#playground) for you to experiment. 

We currently support three public data widgets that can be displayed within the wallet: a bitcoin [price feed](https://github.com/synonymdev/slashtags-widget-price-feed), a bitcoin [news feed](https://github.com/synonymdev/slashtags-widget-news-feed), a bitcoin [block data feed](https://github.com/synonymdev/slashtags-widget-bitcoin-feed).

Finally, we also have an [authentication demo](https://github.com/synonymdev/slashtags-auth-demo).

That is deceivingly simple, but very powerful. For example you can publish your current Email address, Website URL, Twitter handle, Facebook profile, etc. And your contacts who identify you through a Slashtags compatible wallet can always find and reach you, making your identity and reputation censorship resistant.

But you can also directly contact a Slashtag owner if they are listening on their public key, independently from their IP address, thanks to [Hyperswarm](https://github.com/hyperswarm/hyperswarm)'s Distributed Hash Table (DHT).

Slashtags can also create private encrypted drives and share it with one or many peers, serving as either a private feed, or a one-to-one asynchronous communication channel.

The SDK is offered as a single module in the [sdk package](./packages/sdk). The other packages contain components of the SDK. These include the following: 


We realize the existing primitives are not enough on their own to give rise to a web-of-trust and a scalable digital economy that can't be held hostage to the same problems as the current one.

But we will build applications that demonstrate that future, to learn what is missing, and build the missing parts as we go.

## Installation

```bash
npm install @synonymdev/slashtags-sdk
```

Then start a node in your app:

```javascript
import SDK from '@synonymdev/slashtags-sdk';

const sdk = new SDK();
const alice = sdk.slashtag('alice');

console.log(alice.url.toString());
// slash:abc...xyz
```

## Documentation

Documentation is a still work in progress. But you can start by reading the available [specs](./specs/), check out the [examples](./examples/) and read through the API documentation of any package in its README.md.

## Examples

Run `npm install` in the root directory first.

Look into the [examples](./examples/) to learn how to see Slashtags in action.

## Structure

This project is broken into several modules, their purposes are:

- [`/packages/slashtag`](./packages/slashtag): Identity layer of Slashtags protocol.
- [`/packages/drive`](./packages/drive): Hyperdrive manager for each Slashtag.
- [`/packages/sdk`](./packages/sdk): Batteries-included Software development kit.
- [`/packages/cli`](./packages/cli): Provides a daemon with DHT relay for Slashtags SDK.
- [`/packages/rpc`](./packages/rpc): Helper class to create RPC server/clients on top of slashtags.
- [`/packages/url`](./packages/url): Helper functions for encoding/decoding slashtags urls

## Development

Requires Node LTS (v16.5.0).
[nvm](https://github.com/nvm-sh/nvm#intro) is suppported but not required

```
npm install
```
