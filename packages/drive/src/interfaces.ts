export interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  auth: Auth;
}

export interface Auth {
  sign: (message: Uint8Array) => Uint8Array;
  verify: (message: Uint8Array, signature: Uint8Array) => boolean;
}

export interface EventsListeners {
  update: (opts: { seq: number; type: 'del' | 'put'; key: string }) => any;
}
