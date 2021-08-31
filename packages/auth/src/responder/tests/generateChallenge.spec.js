import { generateChallenge } from '../index';

describe('Slashtags Auth: Responder: generateChallenge()', () => {
  it('should create a challenge with a default length 32', () => {
    expect(generateChallenge().length).toEqual(32);
  });

  it('should create a challenge as a Buffer', () => {
    expect(generateChallenge()).toBeInstanceOf(Buffer);
  });
});
