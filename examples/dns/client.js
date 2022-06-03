import { SDK } from '@synonymdev/slashtags-sdk'
import fetch from 'node-fetch'

const address = process.argv[2] || 'alice@localhost:9999'

const sdk = await SDK.init({ persist: false })

const slashtag = await sdk.fromDNS(address, {
  protocol: 'http://',
  fetch
})

const profile = await slashtag.getProfile()

console.log('Resolved profile', profile)

sdk.close()
