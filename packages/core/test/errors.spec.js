import { expect } from 'aegir/utils/chai.js'
import { SlashtagsError } from '../src/index.js'

describe('Errors', () => {
  it('should create a new slashtags error', async () => {
    const NotFound = new SlashtagsError('not found', 'Something not found', {
      something: 'foo'
    })

    expect(NotFound).to.be.an.instanceof(Error)
    expect(NotFound).to.be.an.instanceof(SlashtagsError)
    expect(NotFound.name).to.equal('SlashtagsError')
    expect(NotFound.code).to.equal('NOT_FOUND')
    // @ts-ignore
    expect(NotFound.message).to.equal('Something not found')
    // @ts-ignore
    expect(NotFound.data.something).to.equal('foo')
  })
})
