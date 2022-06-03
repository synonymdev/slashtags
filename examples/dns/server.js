import http from 'http'
import { SDK } from '@synonymdev/slashtags-sdk'

const sdk = await SDK.init({ persist: false })

const alice = sdk.slashtag({ name: 'alice' })
await alice.setProfile({ name: 'Alice' })

const root = sdk.slashtag({ name: 'root' })
await root.setProfile({ name: 'Root' })

const server = http.createServer((req, res) => {
  if (!req.url.startsWith('/.well-known/slashtags')) return

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.end(
    JSON.stringify({
      _: root.url,
      alice: alice.url
    })
  )
})

server.listen(9999, () => {
  console.log('Server listening on localhost:' + 9999)
})
