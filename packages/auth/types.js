// import EventEmitter from 'events';

/**
 * @typedef {{
 *  publicKey: Buffer,
 *  secretKey: Buffer
 * }} KeyPair
 *
 * @typedef {{
 *  DHLEN: number,
 *  PKLEN: number,
 *  SKLEN: number,
 *  ALG: string,
 *  generateKeyPair: (privKey: Buffer) => KeyPair,
 *  dh: (pk: Buffer, lsk: Buffer) => Buffer
 * }} SlashtagsAuthCurve Read moer https://github.com/chm-diederichs/noise-handshake/blob/main/dh.js#L13
 *
 * @typedef {import("events") & {
 *  publicKey: Buffer,
 *  getChallenge: () => Buffer,
 *  identifier: string,
 * }} SlashtagsAuthSession
 *
 */
