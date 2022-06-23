import { expect } from 'aegir/chai'
import RAM from 'random-access-memory'

import { sdk } from './helpers/setup-sdk.js'

describe('options', () => {
  it('should accept custom storage', async () => {
    let usedCustom = false

    const sdkA = await sdk({
      persist: true,
      storage: () => {
        usedCustom = true
        return RAM()
      }
    })

    const alice = sdkA.slashtag({ name: 'foo' })
    await alice.setProfile({ name: 'Alice' })

    expect(usedCustom).to.be.true()

    await sdkA.close()
  })
})
