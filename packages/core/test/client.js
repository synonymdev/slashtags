import { Core } from '../src/index.js'

const main = async () => {
  const node = await Core()

  const result = await node.request('ws://localhost:9999', 'foo', [1, 2, 3])
  node.request('ws://localhost:9999', 'foo', [1])
  setTimeout(() => {}, 600)
  console.log('result', result)
}

main()
