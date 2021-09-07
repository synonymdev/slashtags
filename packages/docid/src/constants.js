export const DocIDCodec = 0xd2

/**
 * Enum DocMutability
 * @enum {string}
 */
export const DocMutability = {
  Static: 'Static',
  Stream: 'Stream'
}

/**
 * Enum DocTypeName
 * @enum {string}
 */
export const DocTypeName = {
  CID: 'CID',
  FeedID: 'FeedID'
}

export const DocTypes = [
  { code: 0, mutability: DocMutability.Static, name: DocTypeName.CID },
  { code: 1, mutability: DocMutability.Stream, name: DocTypeName.FeedID }
].reduce(
  (
    /**
     * @type {{
     *  byCode: {[code: number]: DocType},
     *  byName: {[name: string]: DocType}
     * }}
     */
    acc,
    type
  ) => {
    acc.byCode[type.code] = type
    acc.byName[type.name] = type

    return acc
  },
  { byCode: {}, byName: {} }
)

/** @typedef {import("./interfaces").DocType} DocType */
