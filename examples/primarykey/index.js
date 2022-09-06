import bip39 from 'bip39'
import { BIP32Factory as bip32 } from 'bip32'
import * as ecc from 'tiny-secp256k1'
import SDK, { constants } from '@synonymdev/slashtags-sdk'

const mnemonic = constants.MNEMONIC_TO_PRIMARY_KEY_TEST_VECTORS[0].mnemonic
console.log('Mnemonic:', mnemonic)

const seed = await bip39.mnemonicToSeed(mnemonic)
console.log('\nSeed:', seed)

const root = bip32(ecc).fromSeed(seed) // Network: bitcoin mainnet

const primaryKey = root.derivePath(constants.PRIMARY_KEY_DERIVATION_PATH).privateKey

const sdk = new SDK({ primaryKey })

console.log("\nAlice's publicKey:", sdk.createKeyPair('alice').publicKey)
console.log("\nBob's publicKey:", sdk.createKeyPair('bob').publicKey)

sdk.close()
