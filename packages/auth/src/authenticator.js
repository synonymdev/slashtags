import {
  DEFAULT_CURVE,
  DEFAULT_CHALLENGE_LENGTH,
  CURRENT_VERSION,
} from './constants.js';
import {
  generateChallenge,
  createHandshake,
  validateKeyForCurve,
} from './crypto.js';
import { addSession } from './sessions.js';
import * as varint from './varint.js';

/**
 * @param {KeyPair} keypair - Authenticator's static keypair
 * @param {object} [config] - Authenticator's optional configurations
 * @param {Curve} [config.curve] - Eliptical curve used to create the hanshake
 * @param {Object} [config.metadata] - Metadata object
 * @param {number} [config.challengeLength]
 */
export const createAuth = (keypair, config = {}) => {
  // Defaults
  const curve = config.curve || DEFAULT_CURVE;
  config.metadata = config.metadata;
  const challengeLength = config.challengeLength || DEFAULT_CHALLENGE_LENGTH;

  validateKeyForCurve(curve, keypair.publicKey, keypair.secretKey);

  const handshake = createHandshake('IK', true, keypair, { curve });

  /**
   * Active sessions tracked by the responder
   * @type {Map<string, Session>}
   */
  const sessions = new Map();

  /**
   * Create a new session and return the combine of pubkey and challengeobject
   * @param {number} timeout - Timeout for the session in miliseconds
   * @param {Object} [sessionMetadata] - Session specific metadata (overrides responder metadata)
   * @returns {Uint8Array}
   */
  const newChallenge = (timeout, sessionMetadata) => {
    const challenge = generateChallenge(challengeLength);

    const metadata = new TextEncoder().encode(
      JSON.stringify(sessionMetadata || config.metadata),
    );

    addSession({ timeout, sessions, challenge, metadata });
    const msg = Uint8Array.from([...keypair.publicKey, ...challenge]);

    return varint.prepend([CURRENT_VERSION], msg);
  };

  return {
    get config() {
      return {
        ...config,
        challengeLength,
        curve: curve,
      };
    },
    get sessions() {
      return sessions;
    },
    newChallenge,
  };
};

/** @typedef {import('./interfaces').KeyPair} KeyPair */
/** @typedef {import('./interfaces').Curve} Curve */
/** @typedef {import('./interfaces').Session} Session */
