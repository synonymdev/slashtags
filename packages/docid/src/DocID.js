import { DocIDCodec, DocTypes } from './constants.js'
import { base32 } from 'multiformats/bases/base32'
import { wildDecode } from './util.js'
import { varint } from '@synonymdev/slashtags-common'

/**
 * @param {DocID} docID
 * @param {MultibaseEncoder} [base]
 * @returns {string}
 */
export const toString = (docID, base) => {
  base = base || base32
  return base.encode(docID.bytes)
}

/**
 * Retrun DocID types and the identifying bytes
 * @param {string | Uint8Array} id
 * @throws {Error} Will throw an error if the <multicodec-slashtags-docid> is invalid
 * @returns {DocID}
 */
export const parse = (id) => {
  const bytes = wildDecode(id)
  const [codec, codecFree] = varint.split(bytes)

  if (codec !== DocIDCodec) throw new Error('Invalid Slashtags DocID')

  const [type, key] = varint.split(codecFree)

  return {
    type: DocTypes.byCode[type],
    key,
    bytes
  }
}

/**
 * Create a document id from its type and identifying bytes
 * @param {string | number} type
 * @param {Uint8Array} key
 * @returns {DocID}
 */
export const create = (type, key) => {
  const docType =
    typeof type === 'string' ? DocTypes.byName[type] : DocTypes.byCode[type]

  const bytes = varint.prepend([DocIDCodec, docType.code], key)

  return {
    type: docType,
    key,
    bytes
  }
}

/** @typedef {import("./interfaces").DocID} DocID */
/** @typedef {import("multiformats/bases/interface").MultibaseEncoder<any>} MultibaseEncoder */
/** @typedef {import("multiformats/bases/interface").BaseCodec} BaseCode */
