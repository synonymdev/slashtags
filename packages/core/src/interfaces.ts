export type { Hypercore, Extension, Peer } from 'hyper-sdk';
export type { KeyPair } from 'noise-curve-tiny-secp';

import type { KeyPair } from 'noise-curve-tiny-secp';
import type {
  Peer,
  Hypercore,
  HypercoreOptions as _HypercoreOptions,
  SDKInstance as _SDKInstance,
} from 'hyper-sdk';

import { Server } from 'jayson';

export type keyOrName = string | Buffer;

export interface HypercoreOptions extends _HypercoreOptions {
  announce?: boolean;
  lookup?: boolean;
}

export interface SDKInstance extends _SDKInstance {
  Hypercore<E = Buffer>(
    keyOrName: keyOrName,
    opts?: HypercoreOptions,
  ): Hypercore<E>;
}

export interface Connection {
  send: (data: Buffer) => void;
}

export interface PeerConnection extends Peer, Connection {}

export type JSON =
  | string
  | null
  | boolean
  | number
  | JSON[]
  | { [key: string]: JSON };

export type ServerHypercore = (
  server: Server,
  options: { keyPair: KeyPair },
) => {};
export class RPCServer extends Server {
  hypercore?: ServerHypercore;
}

export interface Core {
  server: RPCServer;
  request: () => void;
}
