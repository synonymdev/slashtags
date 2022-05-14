export interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  auth: Auth;
}

export interface Auth {
  sign: (message: Uint8Array) => Uint8Array;
  verify: (message: Uint8Array, signature: Uint8Array) => boolean;
}
