import { Slashtags } from '@synonymdev/slashtags-core';
import type { ServiceEndpoint, KeyCapabilitySection } from 'did-resolver';

declare module '@synonymdev/slashtags-core' {
  interface Slashtags extends Identity {}
}

// Hypercore Plugin

export interface HypercoreExt {
  hypercoreCreate: (options: {
    key?: Buffer;
    keyPair?: KeyPair;
    lookup?: boolean;
    announce?: boolean;
    sparse?: boolean;
    eagerUpdate?: boolean;
    valueEncoding?: string;
  }) => Promise<{ key: Buffer }>;
  hypercoreAppend: (options: { key: Buffer; data: any }) => Promise<number>;
  hypercoreGet: (options: { key: Buffer; seq?: number }) => Promise<any>;
}

// Identity Plugin
export interface Identity extends HypercoreExt {
  identityCreate: (
    options?: Partial<CreateIdentifierOptions>,
  ) => Promise<Identifier>;
  identityGet: (options: GetIdentifierOptions) => Promise<Identifier>;
  identityUpsertServices: (
    options: UpsertServicesOptions,
  ) => Promise<Identifier>;
}

export interface IdentityOptions {}

// Identifier

export type KeyType = 'ED25519' | 'SECP256K1';

export interface Identifier {
  did: string;
  services?: Service[];
  keys?: PublicKey[];
}

export interface Service {
  id: string;
  type: string;
  serviceEndpoint: string;
  description?: string;
}

export interface PublicKey {
  id: string;
  type: string;
  publicKeyMultibase: string;
  purposes?: KeyCapabilitySection[];
}

export interface KeyPair {
  secretKey: Buffer;
  publicKey?: Buffer;
  type?: KeyType;
}

// Provider

export type CreateIdentifierOptions = {
  keyPair: KeyPair;
} & Omit<Identifier, 'did'>;

export type GetIdentifierOptions = Pick<Identifier, 'did'>;

export type UpsertServicesOptions = Pick<Identifier, 'did' | 'services'>;
export interface IdentityProvider {
  createIdentifier: {
    (options: CreateIdentifierOptions): Promise<Identifier>;
  };
  getIdentifier: {
    (options: GetIdentifierOptions): Promise<Identifier>;
  };
  upsertServices: {
    (options: UpsertServicesOptions): Promise<Identifier>;
  };
}

// SlashDID provider

export interface SlashDIDBlock {
  p?: PublicKey[];
  s?: ServiceEndpoint[];
}

export { Slashtags };
