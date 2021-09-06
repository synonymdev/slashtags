import * as secp256k1 from 'noise-curve-secp';

export const PROLOGUE = Buffer.alloc(0);
export const CHALLENGE_LENGTH = 32;

/** @type {import('./interfaces').Curve} */
// @ts-ignore
export const DEFAULT_CURVE = secp256k1;
