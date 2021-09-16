import { validateKeyForCurve } from '../src/crypto.js'
import { secp256k1 } from 'noise-curve-tiny-secp'
import * as secp from 'noise-handshake/dh.js'
import test from 'ava'

test('should create throw an error for invalid publickey', (t) => {
  const publicKey = secp.generateKeyPair().publicKey

  t.throws(() => validateKeyForCurve(secp256k1, publicKey), {
    message: 'Invalid publicKey size for curve: ' + secp256k1.ALG,
    instanceOf: Error
  })
})

test('should create throw an error for invalid secretKey', (t) => {
  const publicKey = secp256k1.generateKeyPair().publicKey
  const secretKey = new Uint8Array(secp256k1.SKLEN + 10)

  t.throws(() => validateKeyForCurve(secp256k1, publicKey, secretKey), {
    message: 'Invalid secretKey size for curve: ' + secp256k1.ALG,
    instanceOf: Error
  })
})

test('should return true for valid keypair', (t) => {
  const keypair = secp256k1.generateKeyPair()

  t.deepEqual(
    validateKeyForCurve(secp256k1, keypair.publicKey, keypair.secretKey),
    true
  )
})
