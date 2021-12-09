import { signers } from './signers.js'
import { didKeyFromPubKey, verifyJWS, sessionFingerprint } from './utils.js'
import { Auth } from './auth.js'
import { createJWS } from 'did-jwt'

export {
  signers,
  Auth,
  didKeyFromPubKey,
  verifyJWS,
  sessionFingerprint,
  createJWS
}

/** @typedef {import ('./interfaces').FeedInfo} FeedInfo */
/** @typedef {import ('./interfaces').RespondAs} RespondAs */
/** @typedef {import ('./interfaces').RespondAs} Metadata */
/** @typedef {import ('./interfaces').Peer} Peer */
