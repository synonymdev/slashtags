import { expect } from 'aegir/chai'
import { add } from '../src/index.js'

describe('index', () => {
  it('should add 2 + 2', async () => {
    expect(add(2, 2)).to.equal(4)
  })
})
