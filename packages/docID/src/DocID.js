import varint from "varint";
import { DocIDCodec, DocTypes } from "./constants.js";
import { base32 } from "multiformats/bases/base32";
import { decode } from "multibase";

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
 * Returns the first varint and the rest
 * @param {Uint8Array} bytes
 * @returns {[number, Uint8Array]}
 */
const readVarint = (bytes) => {
  const value = varint.decode(bytes);
  const readLength = varint.decode.bytes;
  return [value, bytes.slice(readLength)];
};

/**
 * Retrun DocID types and the identifying bytes
 * @param {string | Uint8Array} id
 * @returns {ParsedDocID | undefined}
 */
export const parse = (id) => {
  const decoded = decode(id);

  const [codec, bytes] = readVarint(decoded);

  if (codec !== DocIDCodec) return;

  const [type, identifyingBytes] = readVarint(bytes);

  return { type: DocTypes.byCode[type], identifyingBytes };
};

/**
 * Create a document id from its type and identifying bytes
 * @param {string | number} type
 * @param {Uint8Array} bytes
 * @returns {DocID}
 */
export const create = (type, bytes) => {
  const docType =
    typeof type === "string" ? DocTypes.byName[type] : DocTypes.byCode[type];

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
