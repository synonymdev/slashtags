import bint from 'bint8array'

/**
 * Provide a canonical way to create a string key from a challenge
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export const hex = (bytes) => bint.toString(bytes, 'hex')

/**
 * Add a session with a timeout to a sessions map
 * @param {Object} config
 * @param {number} config.timeout
 * @param {Map<string, Session>} config.sessions
 * @param {Uint8Array} config.challenge
 * @param {Uint8Array} [config.metadata]
 */
export const addSession = ({ sessions, timeout, challenge, metadata }) => {
  const identifier = hex(challenge)

  const timer = setTimeout(() => {
    if (!sessions.get(identifier)) return
    sessions.delete(identifier)
  }, timeout)

  sessions.set(identifier, {
    challenge,
    timer,
    metadata: metadata || new Uint8Array(0)
  })
}

/** @typedef {import('./interfaces').Session} Session */
