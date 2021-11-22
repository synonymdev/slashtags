export type { debug } from 'debug';

import type {
  WebSocket as Socket,
  ServerOptions as WsServerOptions,
  Server as WsServer,
} from 'ws';
export type { KeyPair } from 'noise-curve-tiny-secp';
import type JRPC from 'simple-jsonrpc-js';

import type { JsonRpcMiddleware, JsonRpcRequest } from 'json-rpc-engine';

import type { KeyPair } from 'noise-curve-tiny-secp';

export type keyOrName = string | Buffer;

export interface Connection {
  send: (data: Buffer) => void;
}

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

export type ServerOptions = WsServerOptions;

export type Server = WsServer;

export interface SlashtagsAPI {
  use: (middleware: JsonRpcMiddleware<any, any>) => void;
  listen: (server: Server) => Promise<Server>;
  request: (
    address: string,
    method: JsonRpcRequest<any>['method'],
    params: JSON,
  ) => Promise<JSON>;
  _openWebSockets: Map<string, { ws: Socket; jrpc: JRPC }>;
}
