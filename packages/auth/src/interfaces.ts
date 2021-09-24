export interface KeyPair {
  publicKey: Buffer;
  secretKey: Buffer;
}

/** Read more https://github.com/chm-diederichs/noise-handshake/blob/main/dh.js#L13 */
export interface Curve {
  DHLEN: number;
  PKLEN: number;
  SKLEN: number;
  ALG: string;
  generateKeyPair: (privKey?: Buffer) => KeyPair;
  dh: (pk: Buffer, lsk: Buffer) => Buffer;
}

export interface Session {
  challenge: Uint8Array;
  timer: NodeJS.Timeout;
  metadata: Uint8Array;
}

export type JSON =
  | string
  | null
  | boolean
  | number
  | JSON[]
  | { [key: string]: JSON };

export interface Initiator {
  respond: (
    remotePK: Uint8Array,
    challenge: Uint8Array,
    metdata?: JSON,
  ) => {
    attestation: Uint8Array;
    verifyResponder: (responderAttestation: Uint8Array) => {
      metadata: JSON;
      responderPK: Uint8Array;
    };
  };
}

export interface Responder {
  sessions: Map<string, Session>;
  newChallenge: (timeout: number, metdata?: JSON | undefined) => Uint8Array;
  verifyInitiator: (attestation: Uint8Array) => {
    metadata: JSON;
    initiatorPK: Uint8Array;
    responderAttestation: Uint8Array;
  };
}
