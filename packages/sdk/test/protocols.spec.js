import { expect } from 'aegir/chai'
import { sdk } from './helpers/setup-sdk.js'
import { SlashProtocol } from '@synonymdev/slashtag'
import { SlashAuth } from '@synonymdev/slashauth'
import { protocolsList, protocols } from '../src/protocols.js'

const defaultProtocols = [SlashAuth]

class Foo extends SlashProtocol {
  static get protocol () {
    return 'foo'
  }
}
class Bar extends SlashProtocol {
  static get protocol () {
    return 'bar'
  }
}

describe('protocols', () => {
  it('should register default protocols on created slashtags', async () => {
    const sdkA = await sdk()

    const alice = sdkA.slashtag({ name: 'alice' })

    expect([...alice._protocols.keys()]).to.eql(
      defaultProtocols.map((p) => p.protocol)
    )

    await sdkA.close()
  })

  it('should export default protocols', () => {
    expect(protocolsList).to.eql(defaultProtocols)
    expect(protocols).to.eql({
      SlashAuth
    })
  })

  it('should register protocols on all created slashtags', async () => {
    const sdkA = await sdk({
      protocols: [Foo, Bar]
    })

    const alice = sdkA.slashtag({ name: 'alice' })

    expect([...alice._protocols.keys()]).to.eql(['foo', 'bar'])

    await sdkA.close()
  })
})
