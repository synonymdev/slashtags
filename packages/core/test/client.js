import { Core } from '../src/index.js'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const main = async () => {
  const node = await Core()

  await node.request('ws://localhost:9999', 'foo', [1, 2, 3])
  console.log(node._openWebSockets.size)
  await delay(3000)
  await node.request('ws://localhost:9999', 'foo', [1, 2, 3])
  await delay(7000)
  console.log(node._openWebSockets.size)
  await delay(100)
}

main()
