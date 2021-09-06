import { decodeChallenge, encodeChallenge } from '../../src/utils/index.js';
import { generateChallenge } from '../../src/responder/index.js';
import secp256k1 from 'noise-curve-secp';
import assert from 'assert';

describe('Slashtags Auth: utils: encodeChallenge(), decodeChallenge()', () => {
  it('should encode a challenge and curve', () => {
    const challenge = generateChallenge();

    const encoded = encodeChallenge(secp256k1.ALG, challenge);

    assert.equal(encoded instanceof Buffer, true);
    const parsed = JSON.parse(encoded.toString());
    assert.deepEqual(
      [parsed[0], Buffer.from(parsed[1])],
      [secp256k1.ALG, challenge],
    );
  });

  it('should decode a challenge and curve from a buffer', () => {
    const challenge = generateChallenge();
    const encoded = encodeChallenge(secp256k1.ALG, challenge);

    const decoded = decodeChallenge(encoded);
    assert.deepEqual(decoded, {
      curveName: secp256k1.ALG,
      challenge,
    });
  });
});
