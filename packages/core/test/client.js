import { Core } from '../src/index.js'

const main = async () => {
  const node = await Core()

  const result = await node.request('ws://localhost:9999', 'foo', [1, 2, 3])
  console.log('first', result)

  let count = 0
  setInterval(async () => {
    const result = await node.request('ws://localhost:9999', 'foo', [count++])
    console.log('result', result)
  })
}

main()
