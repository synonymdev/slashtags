import z32 from 'z32'
import b4a from 'b4a'

export const PATTERN = /^([a-z-]*:)([ybndrfg8ejkmcpqxot1uwisza345h769]+)(\/?[^#?\s]*)\??([^#\s]*)#?([^\s]*)$/

/**
 * Encodes a 32-byte Slashtags key into a z-base32 id
 * @param {*} key
 */
export const encode = key => {
  if (!b4a.isBuffer(key)) throw new Error('Key must be a Buffer')
  if (key.byteLength !== 32) throw new Error('Key must be 32-bytes long')
  return z32.encode(key)
}

/**
 * Formats a Slashtags URL
 * @param {Uint8Array} key
 * @param {object} [opts]
 * @param {string} [opts.protocol]
 * @param {string} [opts.path]
 * @param {object | string} [opts.query]
 * @param {object | string} [opts.fragment]
 * @returns {string}
 */
export const format = (key, opts = {}) => {
  const id = encode(key)

  const protocol = opts.protocol
    ? opts.protocol.endsWith(':')
      ? opts.protocol
      : opts.protocol + ':'
    : 'slash:'

  const path = opts?.path
    ? opts.path.startsWith('/')
      ? opts.path
      : '/' + opts.path
    : ''

  const query = stringify(opts?.query, '?')
  const fragment = stringify(opts.fragment, '#')

  return protocol + id + path + query + fragment
}

/**
 * Parses a Slashtag url
 * @param {string} url
 * @returns
 */
export const parse = url => {
  if (typeof url !== 'string') throw new Error('URL must be a string')

  const matched = url.match(PATTERN)
  if (!matched) throw new Error('Invalid url')

  const protocol = matched[1]
  const key = decode(matched?.[2])
  const id = encode(key)

  return {
    protocol,
    key,
    id,
    path: matched[3],
    query: toObject(matched[4]),
    fragment: matched[5] && '#' + matched[5],
    privateQuery: toObject(matched[5])
  }
}

/**
 * Decodes an id into a 32-bytes key.
 * @param {string} id
 * @returns
 */
export const decode = id => {
  const key = z32.decode(id).subarray(0, 32)
  if (key.byteLength < 32) throw new Error('Invalid key bytelength, got:' + id)
  return key
}

/**
 *
 * @param {string} string
 * @returns
 */
function toObject (string) {
  if (!string || string.length === 0) return {}
  return Object.fromEntries(
    string?.split('&').map(str => {
      const [key, value] = str.split('=')
      return [key, value || true]
    })
  )
}

/**
 *
 * @param {object | string | undefined} object
 * @param {string} prefix
 * @returns
 */
function stringify (object, prefix) {
  if (!object) return ''
  if (typeof object === 'string') {
    return object.startsWith(prefix) ? object : prefix + object
  }
  return prefix + Object.entries(object).map(entry => entry[0] + '=' + entry[1])
}
