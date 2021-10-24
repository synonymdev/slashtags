export type { Hypercore, Extension, Peer } from 'hyper-sdk';
import type { ServerOptions, Server as WebsocketServer } from 'ws';
export type { KeyPair } from 'noise-curve-tiny-secp';

import type {
  JsonRpcEngine,
  JsonRpcMiddleware,
  JsonRpcRequest,
} from 'json-rpc-engine';

import type { KeyPair } from 'noise-curve-tiny-secp';
import type {
  Peer,
  Hypercore,
  HypercoreOptions as _HypercoreOptions,
  SDKInstance as _SDKInstance,
} from 'hyper-sdk';

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

export type SocketOptions = ServerOptions;

export type Server = WebsocketServer;

export interface SlashtagsAPI {
  use: (middleware: JsonRpcMiddleware<any, any>) => void;
  listen: (opts?: SocketOptions) => Promise<Server>;
  request: (
    address: string,
    method: JsonRpcRequest<any>['method'],
    params: JSON,
  ) => Promise<JSON>;
}
