import { expect } from 'aegir/utils/chai.js'
import { SDK } from '../src/sdk.js'
import RAM from 'random-access-memory'
import Corestore from 'corestore'
import b4a from 'b4a'

const { RELAY_URL, BOOTSTRAP } = process.env
const bootstrap = JSON.parse(BOOTSTRAP)

function sdk () {
  return SDK.init({ bootstrap, relays: [RELAY_URL] })
}

describe('SDK', () => {
  describe('hypercore', () => {
    it('should create a hypercore and setup its discovery', async () => {
      const sdkA = await sdk()
      const sdkB = await sdk()

      const origin = await sdkA.hypercore({ name: 'coreA', announce: true })
      const clone = await sdkB.hypercore({ key: origin.key, lookup: true })

      expect(origin.key.length).to.equal(32)
      expect(origin.key).to.eql(clone.key)

      await origin.append('hello')

      expect(await clone.get(0)).to.eql(Buffer.from('hello'))

      await sdkA.close()
      await sdkB.close()
    })

    it('should accept an optional KeyManager to created a namespaced core', async () => {
      const sdkA = await sdk()

      const rootLevel = await sdkA.hypercore({ name: 'coreA' })

      const namespaced = await sdkA.hypercore({
        name: 'coreA',
        keys: sdkA.keys.namespace('foo')
      })

      expect(rootLevel.key).to.not.eql(namespaced.key)

      await sdkA.close()
    })
  })
})
