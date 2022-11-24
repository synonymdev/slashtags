# Slashtags derivation

This document describes how Bitcoin wallets and other Slashtags-based applications can use standard BIP-39 mnemonic words to derive **slashtags** (that is, the main keypairs that are used within the Slashtags protocol). 


## Goals

We had three main goals in our design for the derivation scheme. 

1. Every slashtag should be backed up via a set of BIP-39 mnemonic words. This is the dominant industry standard for backing up users' Bitcoin funds. So one set of BIP-39 mnemonic words can back up both a user's Bitcoin funds and their slashtags. 
2. A public key that can be used to receive Bitcoin funds should never be the public key for a slashtag. 
3. A slashtag should be generated with a semantically relevant name instead of an index number (as with Bitcoin keypairs for receiving funds). 


## Derivation

### Mnemonic words and master seed

Following [BIP-39](https://bips.xyz/39), a series of mnemonic words is created (12, 15, 18, 21, or 24 words). These mnemonic words should be stored by the user for backup purposes. 

Following BIP-39, this set of mnemonic words is used to produce a 512-bit master seed (also known as "BIP-39 seed" or simply the "seed"). The derivation procedure allows for increasing security via a password, which typically should be memorized or at least backed up separately from the mnemonic words.  

### From master seed to PrimaryKey

Following [BIP-32](https://en.bitcoin.it/wiki/BIP_0032), the master seed is turned into a master node. A hardened child node with index "123456" is, then, derived. The resulting private key is referred to as the **primary key** within the Slashtags protocol (identified by the **`primaryKey`** variable within the SDK). 

The index of "123456" clearly distinguishes the derivation of a slashtag from the standard values in the purpose field that indicate various Bitcoin address formats (e.g., segwit at "84", P2PKH-P2WSH at "49", and P2PKH at "44").  

### From primary key to slashtag seed

The primary key can be used to create one or more slashtags. 

To create a slashtag, the primary key is first used to produce a **slashtag seed**. It is produced by a keyed, Blake2b hash function, where the key is the primary key derived in the previous step. The output is a 32-byte uint8array. 

The [implementation](https://sodium-friends.github.io/docs/docs/generichashing#crypto_generichash_batch) of the keyed hash function within the SDK is as follows:

```js
sodium.crypto_generichash_batch(seed, [NS, Buffer.from(name)], pk);
```

The **`seed`** variable here refers the slashtag seed and stores the output of the function. The input of the function is the array. It includes the 256-bit Blake2b hash value of "slashtags" (stored in the **`NS`** variable as `<Buffer 15 8a 40 6f 1f 9b e5 89 9b 0a 7f 04 71 ad eb 39 2d 3e d6 0d 24 e6 47 c5 3c c5 06 d3 f2 0f ac b4>`). It also includes a **`name`** variable, which would typically have semantic meaning (e.g., "Alice", "My social media profile"). The key for the hash function is specified by the **`pk`** variable, which corresponds to the primary key derrived in the previous step. 

### From slashtag seed to slashtag

The slashtag seed is used to create a private-public keypair, known as a **slashtag**. 

To ensure that a Bitcoin keypair for receiving funds can never be equivalent to a slashtag, a different elliptic curve is used for generating it from the slashtag seed than secp256k1, namely **Curve25519**. This curve, like secp256k1, produces 32-byte public keys from 32-byte private keys. As secp256k1 public keys must be 64 bytes (uncompressed) or 33 bytes (compressed), Bitcoin funds can never be sent to a slashtag.     

The [implementation](https://doc.libsodium.org/public-key_cryptography/public-key_signatures#key-pair-generation) of generating the slashtag from a slashtag seed within the SDK is as follows:

```js
sodium.crypto_sign_seed_keypair(keyPair.publicKey, keyPair.secretKey, seed);
```
With the slashtag, one can generate and verify ed25519 signatures. 


### Default slashtag

Some applications might want to utilize a slashtag without a name. In this case, the **`name`** variable can just be empty. The implementation would be as follows: 

```js
sodium.crypto_generichash_batch(seed, [NS, Buffer.from('')], pk);
```
Synonym's [Bitkit wallet](https://github.com/synonymdev/bitkit) currently leverages the default slashtag and associates it with a hyperdrive and also uses it within authentication.  


## Test vectors

Check [key-derivation-test-vector.json](./key-derivation-test-vector.json)
