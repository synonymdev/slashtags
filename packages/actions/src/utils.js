import { createAuth } from '@synonymdev/slashtags-auth'

/** @type {Map<string, {initiator: Initiator}>} */
const auths = new Map()

/**
 * @param {KeyPair} keyPair
 * @param {JSON} metadata
 * @returns {{initiator: Initiator}}
 */
export const memoizedCreateAuth = (keyPair, metadata) => {
  const pk = keyPair.publicKey.toString('hex')

  let auth = auths.get(pk)
  if (auth) return auth

  auth = createAuth(keyPair, { metadata })
  auths.set(pk, auth)
  return auth
}

/** @typedef {import ('@synonymdev/slashtags-auth/types/authenticator').Initiator } Initiator */
/** @typedef {import ('noise-curve-tiny-secp').KeyPair} KeyPair */
/** @typedef {import ('./interfaces').JSON} JSON */
