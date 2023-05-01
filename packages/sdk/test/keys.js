const test = require('brittle')
const b4a = require('b4a')
const RAM = require('random-access-memory')

const SDK = require('../index.js')
const { constants } = SDK

/**
 * Tests vectors for generating Slashtags keys from PrimaryKey,
 * Bitcoin seed, and restoring all created keys from the swarm.
 *
 * This test module should detect any changes that affects key derivation.
 */

test('constants - PRIMARY_KEY_DERIVATION_PATH', (t) => {
  t.is(constants.PRIMARY_KEY_DERIVATION_PATH, "m/123456'")
})

const primaryKeyVectors = [
  {
    description: '0*64 Alice',
    primaryKey: '0'.repeat(64),
    default: '5400e38e349c6c48fbf8c527c9bc88b9db8aa26e96828560bcfc27951ea3d37c',
    name: 'Alice',
    key: '5732d4dceee1eabea6e21983313e4c45c48d1f7c26bb22106e2f2395ce6f379c'
  },
  {
    // Same PrimaryKey, different slashtag name
    description: '0*64 Bob',
    primaryKey: '0'.repeat(64),
    default: '5400e38e349c6c48fbf8c527c9bc88b9db8aa26e96828560bcfc27951ea3d37c',
    name: 'Bob',
    key: 'afe22905140e41d2c03aab0595d1a63555eae3258b321c77d6c66bb6ff1e6a3b'
  },
  {
    // Same slashtag name, different primary key
    description: 'f*64 Alice',
    primaryKey: 'f'.repeat(64),
    default: 'c0e8a73aba8b4c6e9d10964064e8f4dc0ee31e16f2ba681f964ce3d7a163dcd3',
    name: 'Alice',
    key: 'b87b3c477dfb02bcb75aaa9ad658f6c01063b4e18ed2265a8b4d786684744b62'
  }
]

for (const vector of primaryKeyVectors) {
  test('should pass test vector: ' + vector.description, t => {
    const primaryKey = b4a.from(vector.primaryKey, 'hex')
    const sdk = new SDK({ primaryKey, storage: RAM })

    const defaultSlashtag = sdk.slashtag()
    t.alike(defaultSlashtag?.key, b4a.from(vector.default, 'hex'))

    const slashtag = sdk.slashtag(vector.name)
    t.alike(slashtag.key, b4a.from(vector.key, 'hex'))

    sdk.close()
  })
}
