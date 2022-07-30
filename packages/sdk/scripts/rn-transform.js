import { root, path, fs } from './common.js'

const distPath = path.join(root, 'dist').replace('file:', '')
const filename = path.join(distPath, 'index.min.js')
const src = fs.readFileSync(filename).toString()

fs.writeFileSync(path.join(distPath, 'rn.js'), polyfill(transform(src)))

function polyfill (src) {
  const header = `
/* eslint-disable */
import 'react-native-url-polyfill/auto';
`

  return header + src
}

function transformForAwait (src) {
  const disector = 'for await('

  let current = src
  let start = 0

  while (true) {
    const offset = src.slice(start).indexOf(disector)
    if (offset < 0) break
    start = start + offset + disector.length

    current = src.slice(start)

    const parts = current.split(' ')
    const entry = parts[1]
    const _stream = parts[3]
    const streamParenCount = (_stream.split(')')[0].match(/\(/g) || []).length
    const stream = _stream.split(')')[0] + ')'.repeat(streamParenCount)

    const startBlockAt = current.indexOf(stream) + stream.length + 1 // 1 for closing paren

    const rest = current.slice(startBlockAt)
    const closeBlockAt = findEndOfBlock(rest)

    const block = rest.slice(0, closeBlockAt)

    const transformed = `
  await new Promise((resolve, reject) => {
    const s = ${stream};
    s.on('data', async (${entry}) => {${block}});
    s.on('end', resolve);
    s.on('error', reject);
  })
`

    src =
      src.slice(0, start - disector.length) +
      transformed +
      src.slice(start + startBlockAt + closeBlockAt)
  }

  return src
}

function transform (src) {
  return transformForAwait(src)
}

function findEndOfBlock (rest) {
  if (rest.startsWith('{')) {
    const brackets = []
    let offset = 0

    for (const char of rest) {
      offset = offset + 1
      if (char === '{') {
        brackets.push(char)
      } else if (char === '}') {
        brackets.pop()
      }

      if (brackets.length === 0) {
        return offset
      }
    }
  } else {
    return Math.min(rest.indexOf('}'), rest.indexOf(';'))
  }
}
