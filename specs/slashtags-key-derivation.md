# Slashtags key derivation from mnemonic seed phrase

This document describes how Bitcoin wallets can use the same mnemonic seed phrases to derive Slashtags keypairs.

## Goals

1. Deriving Slashtags keypairs from the same mnemonic seed backing up user's Bitcoin funds.
2. Do not use any Bitcoin private key directly as a Slashtag key.
3. Generate Slashtags by semantically relevant names instead of offset `sdk.slashtag({ name: 'the slashtag I use for service Foo' })`

## Derivation

### From mnemonic to binary seed

[BIP39](https://bips.xyz/39) is used to generate mnemonic seed words and derive a binary seed from them.

### From seed to PrimaryKey

[BIP32](https://bips.xyz/32) is used to derive the path `m/123456'`.

### From PrimaryKey to Slashtag key

The resulting key is used as the `primaryKey` for generating Slashtags as follows:

1. Derive a seed from the `primaryKey` and a `name` using [BLAKE2b](https://sodium-friends.github.io/docs/docs/generichashing#crypto_generichash_batch) hash function:

```js
sodium.crypto_generichash_batch(seed, [NS, Buffer.from(name)], pk);
```

- where:

  - `NS` is `<Buffer 15 8a 40 6f 1f 9b e5 89 9b 0a 7f 04 71 ad eb 39 2d 3e d6 0d 24 e6 47 c5 3c c5 06 d3 f2 0f ac b4>` which is the [BLAKE2b](https://sodium-friends.github.io/docs/docs/generichashing#crypto_generichash) hash of `slashtags` string
  - `name` is a utf8 encoded string
  - `pk` is the primaryKey
  - `seed` is the resulting 32 bytes Uint8Array

2. Using the resulting `seed` to generate the Slashtags [Ed25519](https://doc.libsodium.org/public-key_cryptography/public-key_signatures#key-pair-generation) KeyPair:

```js
sodium.crypto_sign_seed_keypair(keyPair.publicKey, keyPair.secretKey, seed);
```

### Default keypair

For convenience's sake, applications might want to create a Slashtag with no name, yet get the same keyPair deterministically, for that this spec suggests using an empty `Name`.

```js
sodium.crypto_generichash_batch(seed, [NS, Buffer.from('')], pk);
```

## Test vectors

Check [key-derivation-test-vector.json](./key-derivation-test-vector.json)
