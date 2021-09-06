import { DocIDCodec, DocTypes } from "./constants.js";
import { base32 } from "multiformats/bases/base32";
import { bases } from "multiformats/basics";
import { varint, bytes } from "multiformats";

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
 * Takes a Uint8Array or string encoded with multibase header, decodes it and
 * returns the decoded buffer
 *
 * @param {string | Uint8Array} input
 * @returns {Uint8Array}
 */
const wildDecode = (input) => {
  if (input instanceof Uint8Array) input = bytes.toString(input);

  const enc = Object.entries(bases).filter(
    (base) => base[1].prefix === input[0]
  )[0][1];

  if (!enc) throw new Error(`Unsupported encoding: ${input[0]}`);

  return enc.decoder.decode(input);
};

/**
 * Retrun DocID types and the identifying bytes
 * @param {string | Uint8Array} id
 * @throws {Error} Will throw an error if the <multicodec-slashtags-docid> is invalid
 * @returns {DocID}
 */
export const parse = (id) => {
  const bytes = wildDecode(id);
  const [codec, codecOffset] = varint.decode(bytes);

  if (codec !== DocIDCodec) throw new Error("Invalid Slashtags DocID");

  const [type, indexOffset] = varint.decode(bytes.slice(codecOffset));

  return {
    type: DocTypes.byCode[type],
    index: bytes.slice(codecOffset + indexOffset),
    bytes,
  };
};

/**
 * Create a document id from its type and identifying bytes
 * @param {string | number} type
 * @param {Uint8Array} index
 * @returns {DocID}
 */
export const create = (type, index) => {
  const docType =
    typeof type === "string" ? DocTypes.byName[type] : DocTypes.byCode[type];

  const typeCodeOffset = varint.encodingLength(DocIDCodec);
  const indexOffset = typeCodeOffset + varint.encodingLength(docType.code);
  const bytes = new Uint8Array(indexOffset + index.byteLength);

  varint.encodeTo(DocIDCodec, bytes, 0);
  varint.encodeTo(docType.code, bytes, typeCodeOffset);
  bytes.set(index, indexOffset);

  return {
    type: docType,
    index,
    bytes,
  };
};

/** @typedef {import("./types").DocID} DocID */
/** @typedef {import("multiformats/bases/interface").MultibaseEncoder<any>} MultibaseEncoder*/
/** @typedef {import("multiformats/bases/interface").BaseCodec} BaseCode */
