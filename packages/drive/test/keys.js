const test = require('brittle')
const crypto = require('hypercore-crypto')
const CoreData = require('@synonymdev/slashtags-core-data')

const Drivestore = require('../index.js')

test('unique private drives for unique keyPairs', async (t) => {
  const kp1 = crypto.keyPair()
  const ds1 = new Drivestore(new CoreData({ keyPair: kp1 }))
  await ds1.ready()
  const ds1Public = ds1.get()
  const ds1Private = ds1.get('contacts')

  const kp2 = crypto.keyPair()
  const ds2 = new Drivestore(new CoreData({ keyPair: kp2 }))
  await ds2.ready()
  const ds2Public = ds2.get('contacts')
  const ds2Private = ds2.get('contacts')

  await Promise.all([ds1Public, ds2Public, ds1Private, ds2Private].map(d => d.ready()))

  t.ok(ds1Public.key)
  t.unlike(ds2Public.key, ds1Public.key)

  t.ok(ds1Private.key)
  t.unlike(ds2Private.key, ds1Private.key)

  ds1._coreData.close()
  ds2._coreData.close()
})
