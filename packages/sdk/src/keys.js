import sodium from 'sodium-universal';
import blake2b from 'blake2b-universal';
import b4a from 'b4a';

const DEFAULT_NAMESPACE = b4a.alloc(0);
const PREFIX = b4a.from('@slashtags/key-manager');

export class KeyManager {
  /** @private */
  _prefix = PREFIX;

  /**
   *
   * @param {Buffer | Uint8Array} [profile]
   * @param {*} [opts]
   */
  constructor(profile, opts = {}) {
    this.profile = profile || KeyManager._generateProfile();

    this._namespace = opts._namespace || DEFAULT_NAMESPACE;
  }

  /**
   *
   * @param {string} name
   * @returns
   */
  createKeyPair(name) {
    const keyPair = {
      publicKey: b4a.allocUnsafe(sodium.crypto_sign_PUBLICKEYBYTES),
      secretKey: b4a.alloc(sodium.crypto_sign_SECRETKEYBYTES),
    };

    sodium.crypto_sign_seed_keypair(
      keyPair.publicKey,
      keyPair.secretKey,
      this._createSecret(name),
    );

    return keyPair;
  }

  /**
   *
   * @param {string} name
   * @returns
   */
  _createSecret(name) {
    if (!name || typeof name !== 'string')
      throw new Error('name must be a String');
    const output = b4a.alloc(32);

    blake2b.batch(
      output,
      [
        this._prefix || PREFIX,
        this._namespace || DEFAULT_NAMESPACE,
        b4a.from(b4a.byteLength(name, 'ascii') + '\n' + name, 'ascii'),
      ],
      this.profile,
    );

    return output;
  }

  /**
   * Generates a new KeyManager with the same profile, and a different namespace.
   * @param {string | Buffer | Uint8Array} name
   * @returns
   */
  namespace(name) {
    if (!b4a.isBuffer(name)) name = b4a.from(name);
    const _namespace = generateNamespace(this._namespace, name);
    return new KeyManager(this.profile, { _namespace });
  }

  /**
   * a convenient utility to generate a profile key.
   */
  static _generateProfile() {
    return randomBytes(sodium.crypto_generichash_KEYBYTES_MIN);
  }
}

/**
 *
 * @param {string | Buffer | Uint8Array} first
 * @param {string | Buffer | Uint8Array} second
 * @returns
 */
function generateNamespace(first, second) {
  if (!b4a.isBuffer(first)) first = b4a.from(first);
  if (second && !b4a.isBuffer(second)) second = b4a.from(second);
  const out = b4a.allocUnsafe(32);
  const input = second
    ? // @ts-ignore
      b4a.concat([first, second])
    : first;
  sodium.crypto_generichash(out, input);
  return out;
}

/**
 *
 * @param {number} n
 * @returns
 */
function randomBytes(n) {
  const buf = b4a.allocUnsafe(n);
  sodium.randombytes_buf(buf);
  return buf;
}
