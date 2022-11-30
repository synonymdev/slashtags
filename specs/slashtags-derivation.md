# Slashtags derivation

This document describes how Bitcoin wallets and other Slashtags-powered applications can use standard BIP-39 mnemonic words to derive **slashtags** (that is, the main keypairs that are used within the Slashtags protocol). 


## Goals

We had three main goals in our design for the slashtag derivation scheme. 

1. Every slashtag should be backed up via a set of BIP-39 mnemonic words. This is the dominant industry standard for backing up a user's Bitcoin funds. So one set of BIP-39 mnemonic words can back up both a user's Bitcoin funds and their slashtags (as well as any further keypairs derived from those slashtags). 
2. A public key that can be used to receive Bitcoin funds should never be the public key for a slashtag (or a public key in a keypair derived from a slashtag). 
3. A slashtag should be generated with a semantically relevant name instead of an index number (the latter is the case with Bitcoin keypairs for creating receiving addresses). 


## Derivation

### Mnemonic words, master seed, and master node

Following [BIP-39](https://bips.xyz/39), a series of mnemonic words is created (12, 15, 18, 21, or 24 words). These mnemonic words should be stored by the user of the application for the backup of their slashtags and, typically, Bitcoin funds.  

Following BIP-39, this set of mnemonic words is used to produce a 512-bit master seed (also known as a "BIP-39 seed" or simply the "seed"). The master seed derivation procedure allows for increasing security via a password, which typically should be memorized or at least backed up separately from the mnemonic words.  

Following [BIP-32](https://en.bitcoin.it/wiki/BIP_0032), the master seed is turned into a master node. 

### From master node to PrimaryKey

From the master node, a hardened child node with index "123456" is derived. The private key of this child node is referred to as the **primary key** within the Slashtags protocol (identified by the **`primaryKey`** variable within the SDK). 

The index of "123456" is clearly distinct from the standard values in the purpose field which indicate various Bitcoin address formats (e.g., native segwit at "84", nested segwit at "49", and legacy at "44"). This is one way in which a slashtag derivation path is clearly distinguishable from that of a Bitcoin address.   

### From primary key to slashtag seed

The primary key can be used to create one or more slashtags. 

To create a slashtag, the primary key is first used to produce a **slashtag seed**. It is produced by a keyed, Blake2b hash function, where the key is the primary key derived in the previous step. The output is a 32-byte Uint8Array. 

The JavaScript Sodium [implementation](https://sodium-friends.github.io/docs/docs/generichashing#crypto_generichash_batch) for this keyed hash function is as follows:

```js
sodium.crypto_generichash_batch(seed, [NS, Buffer.from(name)], pk);
```

The **`seed`** variable here refers to the slashtag seed and stores the output of the function in a 32-byte Uint8Array. 

The input of the function is the array. Its first element is the 32-byte buffer of the Blake2b hash value of "slashtags" (stored in the **`NS`** variable as `<Buffer 15 8a 40 6f 1f 9b e5 89 9b 0a 7f 04 71 ad eb 39 2d 3e d6 0d 24 e6 47 c5 3c c5 06 d3 f2 0f ac b4>`). The second element is the buffer of the **`name`** variable. The value of the name variable would typically have semantic meaning (e.g., "Alice", "My social media profile"). 

The key for the hash function is specified by the **`pk`** variable. This corresponds to the primary key derrived in the previous step. 

### From slashtag seed to slashtag

The slashtag seed is used to create a private-public keypair, known as a **slashtag**. 

A different elliptic curve is used for generating a slashtag from the slashtag seed than secp256k1, namely **Curve25519**. This curve produces 32-byte public keys from 32-byte private keys. As secp256k1 public keys must be 64 bytes (uncompressed) or 33 bytes (compressed), Bitcoin funds can never be (accidentally) sent to a slashtag.  

The JavaScript Sodium [implementation](https://doc.libsodium.org/public-key_cryptography/public-key_signatures#key-pair-generation) for generating the slashtag from a slashtag seed is as follows:

```js
sodium.crypto_sign_seed_keypair(keyPair.publicKey, keyPair.secretKey, seed);
```
With the slashtag, one can generate the **ed25519** signatures used in Slashtags-powered applications. 

### The default slashtag

Any new instance of the SDK allows for specification of a primary key. From this primary key, you can then create one or more slashtags (**`const slashtag = new sdk.slashtag([name])`**). 

Some applications might want to utilize a slashtag without a name. In this case, the **`name`** variable can just be empty. The JavaScript Sodium implementation is as follows: 

```js
sodium.crypto_generichash_batch(seed, [NS, Buffer.from('')], pk);

```
## Test vectors

Check [key-derivation-test-vector.json](./key-derivation-test-vector.json)
