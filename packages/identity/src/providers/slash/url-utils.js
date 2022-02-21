import { varint } from '@synonymdev/slashtags-common';
import { base32 } from 'multiformats/bases/base32';
import b4a from 'b4a';

const URL_PREFIX = 'did:slash:';

/**
 * Convert a public key to a DID
 * @param {Buffer} publicKey
 * @param {'ES256K' | 'EdDSA'} [type = 'ES256K']
 * @returns {string}
 */
export function formatDidUri(publicKey, type) {
  const codec = type === 'ES256K' ? 0xe7 : 0xed;
  return URL_PREFIX + base32.encode(varint.prepend(codec, publicKey));
}

/**
 * Get the public key of the Hypercore from the did uri
 * @param {string} didURI
 */
export function parseDidUri(didURI) {
  const id = didURI.split(':').pop() || '';
  const multiHash = base32.decode(id);
  const codec = multiHash.slice(1)[0];
  const key = b4a.from(multiHash.slice(2));
  return { key, type: codec === 0xe7 ? 'ES256K' : 'EdDSA' };
}
