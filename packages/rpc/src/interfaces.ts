import type { Duplex, EventEmitter } from 'stream';
import type { Defined, RpcParams } from 'jsonrpc-lite';

interface Server extends EventEmitter {
  listen: () => Promise<void>;
  address: () => {
    host: string;
    port: number;
    publicKey: Buffer;
  };
}

export interface NoiseSocket extends Duplex {
  handshakeHash: Buffer;
  remotePublicKey: Buffer;
}
export interface DHT {
  destroy: () => Promise<void>;
  createServer: (onconnection?: (noiseSocket: NoiseSocket) => void) => Server;
  connect: (key: Buffer) => NoiseSocket;
}

export type EngineRequest = {
  id: number;
  method: string;
  params: RpcParams;
  jsonrpc: '2.0';
  noiseSocket: NoiseSocket;
};

export type EngineMethod = (req: EngineRequest) => Promise<Defined>;

export interface SlashtagsRPC {
  addMethods(methods: Record<string, EngineMethod>): void;
  listen: () => Promise<Buffer>;
  request: (
    address: Buffer,
    method: string,
    params: RpcParams,
  ) => Promise<{ body: Defined; noiseSocket: NoiseSocket } | undefined>;
  _openSockets: Map<
    string,
    { noiseSocket: NoiseSocket; resetTimeout: () => void }
  >;
}
