import { homedir } from 'os'

import { expect } from 'aegir/utils/chai.js'
import { storage } from '../../src/storage.js'

describe('Storage nodejs', () => {
  it('should return the default Directory if path not defined', () => {
    const store = storage()
    expect(store).eql(homedir() + '/' + '.slashtags/')
  })

  it('should accept custom storage directory', () => {
    const store = storage('./foo')
    expect(store).eql('./foo')
  })
})
