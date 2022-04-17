import b32 from 'hi-base32'
import b4a from 'b4a'

export function formatURL (key) {
  return 'slash://' + toBase32(key)
}

export function parseURL (url) {
  const parsed = {}
  parsed.protocol = url.split('://')[0]
  url = new URL(url.replace(/^.*:\/\//, 'http://'))
  parsed.key = fromBase32(url.hostname)
  parsed.query = url.searchParams

  return parsed
}

function toBase32 (buf) {
  return b32.encode(b4a.from(buf)).replace(/[=]/g, '').toLowerCase()
}

function fromBase32 (str) {
  return b4a.from(b32.decode.asBytes(str.toUpperCase()))
}
