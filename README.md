<p align="center">
  <a href="https://github.com/synonymdev/slashtags" title="Slashtags">
    <img alt="slashtags" src="./docs/_img/slashtags_brand_mark.png" width="150"></img>
  </a>
</p>

<h3 align="center">JavaScript implementation of the Slashtags protocol</h3>

---

**⚠️ This SDK is still in beta. Please use at your own risk.⚠️**

---

## Overview

Reboot the Web with Slashtags.

Slashtags is an open-source protocol for creating scalable and secure P2P applications. What Bitcoin has done for money and payments, Slashtags seeks to achieve for the rest of our digital data and interactions. 

Slashtags enables you to build applications and websites that give users control over their social profiles, contacts, payment preferences, and other data; allow them to find your server in a p2p fashion and authenticate with just a key; stream account data from slashtag-enabled services; and more. 

All the [keypairs](./specs/slashtags-key-derivation.md) generated within Slashtags are based on a BIP-39 series of mnemonic words. 


### The problem

The modern Web is commonly called the Web 2.0. As the term was originally intended, it refers to a Web with services that are marked by interactive, personalized, easy, and engaging user experiences, interoperability, and scalability. This in contrast to Web 1.0 services, which were instead much more static, isolated, and less scalable. Think your personal website on Geocities from 1997.

While the Web 2.0 has brought a vastly enriched user experience, it has also become synonymous with the oppressive dominance of a few large tech companies—such as Google, Facebook, Youtube, and Twitter—and governments, particularly those with pronounced authoritarian leanings. The modern Web is increasingly marked by censorship, including financial censorship; active, passive, and analytical data collection, which harms our privacy and security; centralized chokepoints for key services against which users are relatively powerless (e.g., drastic changes in a service's policies, interface, or even sunsetting the service) and which form central points of failure; and a highly inefficient use of our communication infrastructure.

At the core of these problems is that regular Web users cannot easily identify themselves in a trustworthy manner online, and that the machines of ordinary users cannot easily communicate directly.


### Slashtags' solution

A [slashtag](./packages/slashtag/README.md) is a key pair [derived](./specs/slashtags-key-derivation.md) from a standard BIP-39 series of mnemonic words, which is also used to generate Bitcoin addresses in practically all modern hardware and software wallets. Typically slashtags are associated with [hyperdrives](./packages/drive/README.md), personal drives for storing data that can be shared within a peer to peer network.

Just as Bitcoin was able to decentralize money and payments with the clever use of cryptographic keys, Slashtags can potentially decentralize much of the rest of our digital data and interactions. It's a simple, yet powerful idea.


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

We are currently developing various other applications that implement Slashtags and are actively supporting others with their own Slashtags projects. 


## Structure

The SDK is offered as a single module in the [sdk package](./packages/sdk). The other packages contain components of the SDK. These include the following: 

- [`/packages/slashtag`](./packages/slashtag): Identity layer of Slashtags protocol.
- [`/packages/drive`](./packages/drive): Hyperdrive manager for each Slashtag.
- [`/packages/sdk`](./packages/sdk): Batteries-included Software development kit.
- [`/packages/cli`](./packages/cli): Provides a daemon with DHT relay for Slashtags SDK.
- [`/packages/rpc`](./packages/rpc): Helper class to create RPC server/clients on top of slashtags.
- [`/packages/url`](./packages/url): Helper functions for encoding/decoding slashtags urls.


## Installation

```bash
npm install @synonymdev/slashtags-sdk,
```
To create a slashtag with the name 'alice' and to output the url, proceed as follows:

```javascript
import SDK from '@synonymdev/slashtags-sdk';

const sdk = new SDK();
const alice = sdk.slashtag('alice');

console.log(alice.url.toString());
// slash:abc...xyz
```

## Documentation

Documentation is a still work in progress. But you can start by reading the available [specs](./specs/), checking out the [examples](./examples/) and read through the API documentation of any subpackage in its README.md.


## Examples

Run `npm install` in the root directory first.

Look into the [examples](./examples/) to learn how to see Slashtags in action.


## Development

Requires Node LTS (v16.5.0).
[nvm](https://github.com/nvm-sh/nvm#intro) is suppported but not required

```
npm install
```
