import type { EventEmitter } from 'events';
import type { Slashtag } from './index';

export interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  auth: Auth;
}

export interface Auth {
  sign: (message: Uint8Array) => Uint8Array;
  verify: (message: Uint8Array, signature: Uint8Array) => boolean;
}

export interface PeerInfo {
  slashtag: Slashtag;
  publicKey: Uint8Array;
}

export interface SecretStream extends EventEmitter {
  publicKey: Uint8Array;
  remotePublicKey: Uint8Array;

  slashtag: Slashtag;
  remoteSlashtag: Slashtag;

  opened: Promise<boolean>;

  write: (message: Uint8Array) => Promise<boolean>;
}

export interface ProtomuxMessage {
  encoding: any;
  onmessage: (message: any, channel: ProtomuxChannel) => void;
  close?: () => void;
  send?: (data: any) => void;
}

export interface ProtomuxChannel {
  peerInfo: PeerInfo;
  handshakeHash: Uint8Array;

  open: () => void;
  messages: ProtomuxMessage[];
}
