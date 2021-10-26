import { Core } from '../src/index.js'

const main = async () => {
  const node = await Core()

  const result = await node.request('ws://localhost:9999', 'foo', [1, 2, 3])
  console.log('first', result)
  const second = await node.request('ws://localhost:9999', 'foo', [1, 2, 3])
  console.log('second', second)
}

main()
