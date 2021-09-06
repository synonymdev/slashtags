import varint from 'varint';
import { DocIDCodec, DocTypes } from './constants.js';
import { base32 } from 'multiformats/bases/base32';
import { bases } from 'multiformats/basics';
import * as multiformats from 'multiformats';

/**
 * @param {DocID} docID
 * @param {MultibaseEncoder} [base]
 * @returns {string}
 */
export const toString = (docID, base) => {
  base = base || base32;
  return base?.encode(docID.bytes);
};

/**
 * Returns a tuple of first varint and the rest
 * @param {Uint8Array} bytes
 * @returns {[number, Uint8Array]}
 */
const readVarint = (bytes) => {
  const value = varint.decode(bytes);
  const readLength = varint.decode.bytes;
  return [value, bytes.slice(readLength)];
};

/**
 * Takes a Uint8Array or string encoded with multibase header, decodes it and
 * returns the decoded buffer
 *
 * @param {string | Uint8Array} input
 * @returns {Uint8Array}
 */
const wildDecode = (input) => {
  if (input instanceof Uint8Array) input = multiformats.bytes.toString(input);

  const enc = Object.entries(bases).filter(
    (base) => base[1].prefix === input[0],
  )[0][1];

  if (!enc) throw new Error(`Unsupported encoding: ${input[0]}`);

  return enc.decoder.decode(input);
};

/**
 * Retrun DocID types and the identifying bytes
 * @param {string | Uint8Array} id
 * @throws {Error} Will throw an error if the <multicodec-slashtags-docid> is invalid
 * @returns {ParsedDocID | undefined}
 */
export const parse = (id) => {
  const decoded = wildDecode(id);
  const [codec, bytes] = readVarint(decoded);

  if (codec !== DocIDCodec) throw new Error('Invalid Slashtags DocID');

  const [type, index] = readVarint(bytes);
  return { type: DocTypes.byCode[type], index };
};

/**
 * Create a document id from its type and identifying bytes
 * @param {string | number} type
 * @param {Uint8Array} bytes
 * @returns {DocID}
 */
export const create = (type, bytes) => {
  const docType =
    typeof type === 'string' ? DocTypes.byName[type] : DocTypes.byCode[type];

  const resultBytes = Uint8Array.from([
    ...varint.encode(DocIDCodec),
    ...varint.encode(docType.code),
    ...bytes,
  ]);

  return {
    type: docType,
    bytes: resultBytes,
  };
};

/** @typedef {import("./types").DocID} DocID */
/** @typedef {import("./types").ParsedDocID} ParsedDocID */
/** @typedef {import("multiformats/bases/interface").MultibaseEncoder<any>} MultibaseEncoder*/
/** @typedef {import("multiformats/bases/interface").BaseCodec} BaseCode */
