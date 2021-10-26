import URI from 'urijs'
import { base32 } from 'multiformats/bases/base32'
import { varint } from '@synonymdev/slashtags-common'
import { createAuth } from '@synonymdev/slashtags-auth'

/**
 *
 * @param {string} url
 * @returns
 */
export const parseURL = (url) => {
  const uri = new URI(url)

  return { hostname: uri.hostname(), query: uri.search(true) }
}

/**
 * @param {string} address
 */
const processAddress = (address) => {
  const bytes = base32.decode(address)

  let result = varint.split(bytes)
  result = varint.split(result[1])
  result = varint.split(result[1])

  return new URL(Buffer.from(result[1]).toString()).toString()
}

/** @type {Map<string, {initiator: Initiator}>} */
const auths = new Map()

/**
 * @param {KeyPair} keyPair
 * @param {JSON} metadata
 * @returns {{initiator: Initiator}}
 */
const memoizedCreateAuth = (keyPair, metadata) => {
  const pk = keyPair.publicKey.toString('hex')

  let auth = auths.get(pk)
  if (auth) return auth

  auth = createAuth(keyPair, { metadata })
  auths.set(pk, auth)
  return auth
}

/**
 * @param {object} opts
 * @param {SlashtagsAPI} opts.node
 * @returns
 */
export const SlashtagsActions = ({ node }) => {
  // TODO: test if instance of SlashtagsAPI (create the classe in the first place)
  if (!node) {
    throw new Error('SlashActions requires a node implementing SlashtagsAPI')
  }

  const supportedActions = ['ACT_1']

  /**
   *
   * @param {string} url
   * @param {CallBacks} [callbacks]
   * @returns {Promise<HandleResponse>}
   */
  const handle = async (url, callbacks) => {
    const { hostname, query } = parseURL(url)

    /** @type {{act: string, tkt: string}} */
    // @ts-ignore
    let { act, tkt } = query
    act = 'ACT_' + act

    // TODO: check if the ticket is valid? for all actions?

    const address = processAddress(hostname)

    if (!address) {
      return {
        status: 'SKIP',
        reason: 'Invalid address',
        address: hostname,
        act,
        tkt
      }
    }

    if (!supportedActions.includes(act)) {
      return {
        status: 'SKIP',
        reason: 'Unsupported action',
        act,
        tkt,
        address
      }
    }

    if (!callbacks?.[act]) {
      return {
        status: 'SKIP',
        reason: 'No callback for this action',
        act,
        tkt,
        address
      }
    }

    switch (act) {
      case 'ACT_1':
        try {
          /** @type {{[key:string]: string}} */
          // @ts-ignore
          const {
            challenge,
            publicKey,
            name,
            image,
            description,
            background,
            url
          } = await node.request(address, 'ACT_1/GET_CHALLENGE', {})

          const promptResponse = await callbacks?.[act]?.onChallenge({
            publicKey,
            name,
            image,
            description,
            background,
            url
          })

          // User rejected authentication prompt
          if (!promptResponse) {
            return {
              status: 'SKIP',
              reason: 'User rejected prompt',
              act,
              tkt,
              address
            }
          }

          const { keyPair, metadata } = promptResponse

          const auth = memoizedCreateAuth(keyPair, metadata)

          const { attestation, verifyResponder } = auth.initiator.respond(
            Buffer.from(publicKey, 'hex'),
            Buffer.from(challenge, 'hex')
          )

          const answer = await node.request(address, 'ACT_1/RESPOND', {
            attestation: Buffer.from(attestation).toString('hex'),
            ticket: tkt
          })

          // @ts-ignore
          if (answer.code < 0) return { status: 'Error', ...answer }

          /** @type {{attestation: string}} */
          // @ts-ignore
          const { attestation: responderAttestation } = answer

          const verifiedResponderMetadataAndPK = verifyResponder(
            Buffer.from(responderAttestation, 'hex')
          )

          callbacks?.[act]?.onSuccess?.(verifiedResponderMetadataAndPK)

          return { status: 'OK', act, tkt, address }
        } catch (error) {
          callbacks?.[act]?.onError?.(error)
          return { status: 'ERROR', error, address, act, tkt }
        }

      default:
        return {
          status: 'SKIP',
          reason: 'Unsupported action',
          act,
          tkt,
          address
        }
    }
  }

  return { supportedActions, handle }
}

/** @typedef {import ('@synonymdev/slashtags-core').SlashtagsAPI} SlashtagsAPI */
/** @typedef {import ('@synonymdev/slashtags-auth/types/authenticator').Initiator } Initiator */
/** @typedef {import ('./interfaces').KeyPair} KeyPair */
/** @typedef {import ('./interfaces').JSON} JSON */
/** @typedef {import ('./interfaces').CallBacks} CallBacks */
/** @typedef {import ('./interfaces').HandleResponse} HandleResponse */
