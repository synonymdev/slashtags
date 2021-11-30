import type { Duplex, EventEmitter } from 'stream';

export type { debug } from 'debug';

export type JSONElement = string | null | boolean | number;
export type JSON = JSONElement | JSONElement[] | { [key: string]: JSONElement };

interface Server extends EventEmitter {
  listen: () => Promise<void>;
  _keyPair: { publicKey: Buffer; secretKey: Buffer };
}

export interface NoiseSocket extends Duplex {
  handshakeHash: Buffer;
}
export interface DHT {
  createServer: (onconnection: (noiseSocket: NoiseSocket) => void) => Server;
  connect: (key: Buffer) => NoiseSocket;
}

export interface SlashtagsRPC {
  use: (method: string, params: string[], cb: (...args: any) => any) => void;
  listen: () => Promise<Buffer>;
  request: (
    address: Buffer,
    method: string,
    params: JSONElement[] | Record<string, JSONElement>,
  ) => Promise<JSON>;
  _openSockets: Map<string, NoiseSocket>;
}

export interface SlashtagsAPI extends SlashtagsRPC {}
