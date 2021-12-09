import type { Duplex, EventEmitter } from 'stream';
import type { JSONElement } from '@synonymdev/slashtags-common';

interface Server extends EventEmitter {
  listen: () => Promise<void>;
  address: () => {
    host: string;
    port: number;
    publicKey: Uint8Array;
  };
}

export interface NoiseSocket extends Duplex {
  handshakeHash: Uint8Array;
  remotePublicKey: Uint8Array;
}
export interface DHT {
  destroy: () => Promise<void>;
  createServer: (onconnection?: (noiseSocket: NoiseSocket) => void) => Server;
  connect: (key: Uint8Array) => NoiseSocket;
}

export type RpcParams = Record<string, JSONElement>;

export type EngineRequest = {
  id: number;
  method: string;
  params: RpcParams;
  jsonrpc: '2.0';
  noiseSocket: NoiseSocket;
};

export type EngineMethod = (req: EngineRequest) => Promise<JSONElement>;

export interface SlashtagsRPC {
  addMethods(methods: Record<string, EngineMethod>): void;
  listen: () => Promise<Uint8Array>;
  request: (
    address: Uint8Array,
    method: string,
    params: RpcParams,
  ) => Promise<{ body: JSONElement; noiseSocket: NoiseSocket }>;
  _openSockets: Map<
    string,
    { noiseSocket: NoiseSocket; resetTimeout: () => void }
  >;
}
