import Corestore from 'corestore'
import b4a from 'b4a'

import { expect } from 'aegir/utils/chai.js'
import { storage } from '../../src/storage.js'

describe('Storage browser', () => {
  it('should save and retrieve data', async () => {
    const store = new Corestore(storage())

    const core = await store.get({ name: 'bar' })
    await core.ready()

    core.append(['foo', 'bar'])

    await store.close()

    //

    const store2 = new Corestore(storage())

    const retrieved = await store2.get({ name: 'bar' })
    await retrieved.ready()

    expect(retrieved.length).eql(2)
    expect(await retrieved.get(0)).eql(b4a.from('foo'))
    expect(await retrieved.get(1)).eql(b4a.from('bar'))
  })
})
