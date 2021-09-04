import * as crypto from "crypto";
import * as json from "multiformats/codecs/json";
import * as multihash from "multihashes";
import * as multibase from "multibase";
import {
  DEFAULT_BASE,
  DEFAULT_CONTENT_TYPE,
  DEFAULT_HASH,
  SLASHTAGS_ID_TYPES,
} from "../constants";
import * as varint from "varint";

/**
 * Create a Slashtags content ID (STCID) from a hash.
 * @param {Uint8Array} hash
 * @param {object} opts - options
 * @param {multihash.HashCode} opts.hashCode - hash fn code
 * @param {multibase.BaseName} [opts.base=DEFAULT_BASE]
 * @param {number} [opts.idCode=0] - slashtag identifier code
 * @param {number} [opts.contentType=DEFAULT_CONTENT_TYPE]
 * @returns {Uint8Array}
 */
export const fromHash = (hash, opts) => {
  const hashEncoded = multihash.encode(hash, opts?.hashCode);

  const contentTypeCodeVarint = varint.encode(
    opts?.contentType || DEFAULT_CONTENT_TYPE
  );

  const idCodeVarint = varint.encode(
    opts?.idCode || SLASHTAGS_ID_TYPES.byName.STCIDV0.code
  );

  return multibase.encode(
    opts?.base || DEFAULT_BASE,
    Uint8Array.from([...idCodeVarint, ...contentTypeCodeVarint, ...hashEncoded])
  );
};

/**
 * Create a Slashtags content ID (STCID) from a serializable object,
 * using the default hash function sha256.
 * @param {Serializable[] | Record<string, Serializable>} content
 * @param {object} [opts] - options
 * @param {multibase.BaseName} [opts.base=DEFAULT_BASE]
 * @param {number} [opts.idCode=0] - slashtag identifier code
 * @param {number} [opts.contentType=DEFAULT_CONTENT_TYPE]
 * @returns {Uint8Array}
 */
export const fromContent = (content, opts) => {
  const bytes = json.encode(content);
  const hash = crypto.createHash("sha256").update(bytes).digest();

  return fromHash(hash, { ...opts, hashCode: DEFAULT_HASH });
};

/**
 * Convert Uint8Array bytes to utf-8 string.
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export const toString = (bytes) => new TextDecoder().decode(bytes);

/**
 * Parses a bytes STCID to its details.
 * @param {Uint8Array} bytes
 * @returns {{
 *  type: string,
 *  idCode: number,
 *  hashCode: number,
 * }}
 */
export const parseBytes = (bytes) => {
  const idCode = varint.decode(bytes);
  const hashCode = varint.decode(bytes.slice(varint.decode.bytes));

  return {
    type: SLASHTAGS_ID_TYPES.byCode[idCode]?.name,
    idCode,
    hashCode,
  };
};

/**
 * Parses a srting STCID to its details.
 * @param {string} string
 * @returns {{
 *  type: string,
 *  idCode: number,
 *  hashCode: number,
 * }}
 */
export const parseString = (string) => {
  const bytes = multibase.decode(string);

  return parseBytes(bytes);
};
