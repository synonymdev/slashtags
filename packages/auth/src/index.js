import { signers } from './signers.js'
import {
  didKeyFromPubKey,
  verifyFactory,
  sessionFingerprint
} from './utils.js'
import { Auth } from './auth.js'
import { createJWS } from 'did-jwt'

export {
  signers,
  Auth,
  didKeyFromPubKey,
  verifyFactory,
  sessionFingerprint,
  createJWS
}

/** @typedef {import ('./interfaces').Profile} Profile */
/** @typedef {import ('./interfaces').PeerConfig} PeerConfig */
