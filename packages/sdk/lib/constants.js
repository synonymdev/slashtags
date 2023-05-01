/** Derivation path for generating a PrimaryKey from a Bitcoion seed */
const PRIMARY_KEY_DERIVATION_PATH = "m/123456'"

/** Test vectors for converting menemonic phrases to primary keys for Slasthags key derivation */
const MNEMONIC_TO_PRIMARY_KEY_TEST_VECTORS = [
  {
    mnemonic: 'village behave language three milk aisle together story similar cat dust claw',
    primaryKeyHex: '673dea0c9d2ae8b9276c28f410d2a7a17c281de6a66f1e3436ceded0410280b6'
  },
  {
    mnemonic: 'promote assist jacket exhibit cheese film survey omit march joke museum october',
    primaryKeyHex: '640a11b9c2e35e0b7f165dac4258723c32d81f72454b75e4f9ecef09b7233344'
  }
]

module.exports = {
  PRIMARY_KEY_DERIVATION_PATH,
  MNEMONIC_TO_PRIMARY_KEY_TEST_VECTORS
}
