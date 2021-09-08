import { generateChallenge } from '../src/crypto.js'
import test from 'ava'

test('should create a challenge with a default length 32', (t) => {
  t.deepEqual(generateChallenge().length, 32)
})

test('should create a challenge as a Buffer', (t) => {
  t.deepEqual(generateChallenge() instanceof Buffer, true)
})
