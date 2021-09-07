import { validateKeyForCurve } from '../../src/crypto.js';
import * as secp256k1 from 'noise-curve-secp';
import * as secp from 'noise-handshake/dh.js';
import assert from 'assert';

describe('Slashtags Auth: validateKeyForCurve()', () => {
  it('should create throw an error for invalid publickey', () => {
    const publicKey = secp.generateKeyPair().publicKey;
    let error;

    try {
      validateKeyForCurve(secp256k1, publicKey);
    } catch (err) {
      error = err;
    }

    assert.equal(
      error.message,

      'Invalid publicKey size for curve: ' + secp256k1.ALG,
    );
  });

  it('should create throw an error for invalid secretKey', () => {
    const publicKey = secp256k1.generateKeyPair().publicKey;
    const secretKey = Buffer.alloc(secp256k1.SKLEN + 10);
    let error;

    try {
      validateKeyForCurve(secp256k1, publicKey, secretKey);
    } catch (err) {
      error = err;
    }

    assert.equal(
      error.message,
      'Invalid secretKey size for curve: ' + secp256k1.ALG,
    );
  });

  it('should return true for valid keypair', () => {
    const keypair = secp256k1.generateKeyPair();

    assert.equal(
      validateKeyForCurve(secp256k1, keypair.publicKey, keypair.secretKey),
      true,
    );
  });
});
