import test from 'brittle'
import Slashtag from '../index.js'

test.skip('create encrypted drive', async t => {
  const alice = new Slashtag()
  // const drive = alice.drive('foo')
  // await drive.ready()

  await alice.close()
})
