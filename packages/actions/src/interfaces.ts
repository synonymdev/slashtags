export type { KeyPair } from 'noise-curve-tiny-secp';

import type { KeyPair } from '.';

export type JSON =
  | string
  | null
  | boolean
  | number
  | JSON[]
  | { [key: string]: JSON };

export type ACT_1Callback = {
  onChallenge: (params: {
    publicKey: string;
    name: string;
    image: string;
    description: string;
    background: string;
    url: string;
  }) =>
    | {
        metadata: JSON & {
          name: string;
          image: string;
          description?: string;
          background?: string;
          url?: string;
        };
        keyPair: KeyPair;
      }
    | false
    | undefined;
  onSuccess?: (params: { metadata: JSON; responderPK: Uint8Array }) => any;
  onError?: (err: unknown) => any;
};

export type CallBacks = {
  ACT_1?: ACT_1Callback;
  [key: string]: any;
};

export type HandleResponse = { act: string; tkt: string; address: string } & (
  | { status: 'SKIP'; reason: string }
  | { status: 'OK' }
  | { status: 'ERROR'; error: any }
);
