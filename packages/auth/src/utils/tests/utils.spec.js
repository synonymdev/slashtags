import { decodeChallenge, encodeChallenge } from '../index.js';
import { generateChallenge } from '../../challenger/index.js';
import secp256k1 from 'noise-curve-secp';

describe('Slashtags Auth: utils: encodeChallenge(), decodeChallenge()', () => {
  it('should encode a challenge and curve', () => {
    const challenge = generateChallenge();

    const encoded = encodeChallenge(secp256k1.ALG, challenge);

    expect(encoded).toBeInstanceOf(Buffer);
    const parsed = JSON.parse(encoded.toString());
    expect([parsed[0], Buffer.from(parsed[1])]).toEqual([
      secp256k1.ALG,
      challenge,
    ]);
  });

  it('should decode a challenge and curve from a buffer', () => {
    const challenge = generateChallenge();
    const encoded = encodeChallenge(secp256k1.ALG, challenge);

    const decoded = decodeChallenge(encoded);
    expect(decoded).toEqual({
      curveName: secp256k1.ALG,
      challenge,
    });
  });
});
