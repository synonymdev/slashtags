import varint from "varint";
import { DocIDCodec, DocTypes } from "./constants.js";
import { base32 } from "multiformats/bases/base32";

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
/** @typedef {import("multiformats/bases/interface").MultibaseEncoder<any>} MultibaseEncoder*/
