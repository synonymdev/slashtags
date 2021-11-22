import { createAuth } from '@synonymdev/slashtags-auth'

/** @type {Map<string, {initiator: Initiator}>} */
const auths = new Map()

/**
 * @param {KeyPair} keyPair
 * @param {Metadata} metadata
 * @returns {{initiator: Initiator}}
 */
export const memoizedCreateAuth = (keyPair, metadata) => {
  const pk = keyPair.publicKey.toString('hex')

  let auth = auths.get(pk)
  if (auth) return auth

  // @ts-ignore
  auth = createAuth(keyPair, { metadata })
  auths.set(pk, auth)
  return auth
}

// TODO: Remove ts-ignore
// @ts-ignore
/** @typedef {import ('@synonymdev/slashtags-auth/types/authenticator').Initiator } Initiator */
/** @typedef {import ('noise-curve-tiny-secp').KeyPair} KeyPair */
/** @typedef {import ('./interfaces').Metadata} Metadata */
