import sodium from 'sodium-universal';
import { encodeChallenge, createHandshake } from '../utils/index.js';
import { PROLOGUE, CHALLENGE_LENGTH, DEFAULT_CURVE } from '../constants.js';

/**
 * Generate new random challenge
 * @param {number} challengeLength
 * @returns {Buffer}
 */
export const generateChallenge = (challengeLength = CHALLENGE_LENGTH) => {
  const challenge = Buffer.allocUnsafe(challengeLength);
  sodium.randombytes_buf(challenge);
  return challenge;
};

/** @type {(challenge:Buffer) => string} */
const sessionID = (challenge) => challenge.toString('hex');

/**
 * Verify an Initiator's attestation to a challenge of an active session
 * @param {Object} config
 * @param {KeyPair} config.keypair
 * @param {Map<string, Session>} config.sessions
 * @param {Buffer} config.attestation
 * @param {Curve} config.curve
 * @param {number} [config.challengeLength=CHALLENGE_LENGTH]
 */
export const _verify = ({
  keypair,
  sessions,
  attestation,
  curve,
  challengeLength = CHALLENGE_LENGTH,
}) => {
  const handshake = createHandshake('IK', false, keypair, { curve });

  handshake.initialise(PROLOGUE);
  const res = handshake.recv(attestation);

  const challenge = res.subarray(0, challengeLength);
  const initiatorMetadata = res.subarray(challengeLength);

  const session = sessions.get(sessionID(challenge));

  if (session == null) {
    throw new Error(`Challenge ${sessionID(challenge)} not found`);
  }

  sessions.delete(challenge.toString('hex'));

  const msg = {
    responderPublicKey: keypair.publicKey.toString('hex'),
    responderMetadata:
      session.responderMetdata &&
      Buffer.from(session.responderMetdata).toString(),
  };

  const responderAttestation = Buffer.from(
    handshake.send(Buffer.from(JSON.stringify(msg))),
  );

  return {
    /** @type {Buffer} Responder's attestation for bidirectional authentication */
    responderAttestation,
    /** @type {Buffer} Initiator's metadata retrieved from the attestation */
    initiatorMetadata,
  };
};

/**
 * @typedef {{
 *  challenge: Buffer,
 *  timer: NodeJS.Timeout,
 *  responderMetdata?: Buffer,
 * }} Session
 *
 * @param {Object} config
 * @param {number} config.timeout
 * @param {Map<string, Session>} config.sessions
 * @param {Buffer} config.challenge
 * @param {Buffer} [config.responderMetdata]
 */
export const addSession = ({
  sessions,
  timeout,
  challenge,
  responderMetdata,
}) => {
  const identifier = sessionID(challenge);

  const timer = setTimeout(() => {
    if (!sessions.has(identifier)) return;
    sessions.delete(identifier);
  }, timeout);

  const session = {
    challenge,
    timer,
    responderMetdata,
  };

  sessions.set(identifier, session);
};

/**
 * Create a Responder that create and tracks sessions
 * @param {object} config
 * @param {KeyPair} config.keypair - Responder keypair
 * @param {string} [config.attestationURL] - URL for the initiator to send attestations to
 * @param {number} [config.challengeLength=CHALLENGE_LENGTH] - Length of the challenge
 * @param {Curve} [config.curve] - Curve to use for Noise handshake
 * @param {Object} [config.metadata] - Responder metadata
 */
export const createResponder = ({
  keypair,
  attestationURL,
  challengeLength = CHALLENGE_LENGTH,
  curve = DEFAULT_CURVE,
  metadata,
}) => {
  /**
   * Active sessions tracked by the responder
   * @type {Map<string, Session>}
   */
  const sessions = new Map();

  /**
   * Create a new session and return the challenge object
   * @param {number} timeout - Timeout for the session in miliseconds
   * @param {Object} [sessionMetadata] - Session specific metadata (overrides responder metadata)
   */
  const newChallenge = (timeout, sessionMetadata) => {
    const challenge = generateChallenge(challengeLength);

    metadata = sessionMetadata || metadata;

    addSession({
      timeout,
      sessions,
      challenge,
      responderMetdata: metadata && Buffer.from(JSON.stringify(metadata)),
    });

    return {
      attestationURL,
      responderPublicKey: keypair.publicKey,
      challenge: encodeChallenge(curve.ALG, challenge),
    };
  };

  /**
   * Verify an intitiator's attestation to a challenge
   * @param {Buffer} attestation
   * @returns {{
   *  responderAttestation: Buffer,
   *  initiatorMetadata?: Object,
   * }}
   */
  const verify = (attestation) => {
    const result = _verify({ keypair, attestation, sessions, curve });
    try {
      result.initiatorMetadata = JSON.parse(
        result.initiatorMetadata.toString(),
      );
    } catch (error) {}
    return result;
  };

  return {
    config: { keypair, curve, challengeLength },
    sessions,
    newChallenge,
    verify,
  };
};

/** @typedef {import("../interfaces").KeyPair} KeyPair */
/** @typedef {import("../interfaces").Curve} Curve */
