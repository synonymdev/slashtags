import { generateChallenge } from '../src/crypto.js'
import test from 'ava'

test('should create a challenge with a default length 32', (t) => {
  t.deepEqual(generateChallenge().length, 32)
})

test('should create a challenge as an instance of Uint8Array', (t) => {
  t.deepEqual(generateChallenge() instanceof Uint8Array, true)
})
