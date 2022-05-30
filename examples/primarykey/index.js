import bip39 from 'bip39'
import { BIP32Factory as bip32 } from 'bip32'
import * as ecc from 'tiny-secp256k1'
import { SDK } from '@synonymdev/slashtags-sdk'

const mnemonic =
  'village behave language three milk aisle together story similar cat dust claw'
console.log('Mnemonic:', mnemonic)

const seed = await bip39.mnemonicToSeed(mnemonic)
console.log('\nSeed:', seed)

const root = await bip32(ecc).fromSeed(seed) // Network: bitcoin mainnet

const primaryKey = root.derivePath(SDK.DERIVATION_PATH).privateKey

const sdk = new SDK({ primaryKey })

console.log("\nAlice's publicKey:", sdk.createKeyPair('alice').publicKey)
console.log("\nBob's publicKey:", sdk.createKeyPair('bob').publicKey)

sdk.close()
