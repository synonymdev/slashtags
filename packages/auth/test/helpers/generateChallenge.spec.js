import { generateChallenge } from '../../src/crypto.js';
import assert from 'assert';

describe('Slashtags Auth: Responder: generateChallenge()', () => {
  it('should create a challenge with a default length 32', () => {
    assert.equal(generateChallenge().length, 32);
  });

  it('should create a challenge as a Buffer', () => {
    assert.equal(generateChallenge() instanceof Buffer, true);
  });
});
