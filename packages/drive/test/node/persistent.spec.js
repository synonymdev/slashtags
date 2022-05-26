import b4a from 'b4a'
import Corestore from 'corestore'
import path from 'path'

import { expect } from 'aegir/chai'
import { SlashDrive } from '../../src/index.js'
import { replicate } from '../helpers/replicate.js'
const os = await import('os')

const storageDir = path.join(
  os.tmpdir(),
  'slash-drive-test' + Math.random().toString(16).slice(2)
)

describe('Persistent storage', () => {
  it.skip('should open encrypted drives from storage with the correct encryptedKey', async () => {
    const originContent = b4a.from(JSON.stringify({ foo: 'bar' }))

    // Create an encrypted drive
    const originStore = new Corestore(path.join(storageDir, '/origin'))
    const origin = new SlashDrive({
      keyPair: await originStore.createKeyPair('foo'),
      store: originStore,
      encrypted: true
    })

    await origin.put('profile.json', originContent)

    const driveOpts = {
      key: origin.key,
      encryptionKey: origin.encryptionKey
    }

    expect(driveOpts.key.length).to.eql(32)
    expect(driveOpts.encryptionKey.length).to.eql(32)

    // Clone to storage
    await openClone()

    // open clone from storage
    await openClone()

    async function openClone () {
      const store = new Corestore(path.join(storageDir, '/clone'))
      const clone = new SlashDrive({
        ...driveOpts,
        store
      })

      await replicate(origin, clone)

      const cloneContent = await clone.get('profile.json')

      expect(cloneContent).to.eql(originContent)

      await store.close()
    }
  })
})
