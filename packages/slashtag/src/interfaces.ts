import type { Slashtag } from './index'

export interface KeyPair {
  publicKey: Uint8Array
  secretKey: Uint8Array
  auth: Auth
}

export interface Auth {
  sign: (message: Uint8Array) => Uint8Array
  verify: (message: Uint8Array, signature: Uint8Array) => boolean
}

export interface PeerInfo {
  slashtag: Slashtag
  publicKey: Uint8Array
}

export interface SecretStream {
  publicKey: Uint8Array
  remotePublicKey: Uint8Array

  opened: Promise<boolean>
}
