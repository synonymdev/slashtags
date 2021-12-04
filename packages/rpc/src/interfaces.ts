import type { Duplex, EventEmitter } from 'stream';

export type { debug } from 'debug';

export type JSONElement = string | null | boolean | number;
export type JSON = JSONElement | JSONElement[] | { [key: string]: JSONElement };

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

export interface SlashtagsRPC {
  destroy: () => Promise<void>;
  use: (method: string, params: string[], cb: (...args: any) => any) => void;
  listen: () => Promise<Buffer>;
  request: (
    address: Buffer,
    method: string,
    params: JSONElement[] | Record<string, JSONElement>,
  ) => Promise<JSON>;
  _openSockets: Map<string, NoiseSocket>;
}
