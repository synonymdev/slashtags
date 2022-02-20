import { Slashtags } from '@synonymdev/slashtags-core';
import type { ServiceEndpoint, KeyCapabilitySection } from 'did-resolver';
import type level from 'level';

declare module '@synonymdev/slashtags-core' {
  interface Slashtags extends Identity {}
}

export interface Storage {
  storageRelativePath: (path: string) => string;
}

export interface DataStore {
  dataStoreCreateDB: (options: { dbName: string }) => Promise<level.LevelDB>;
}

export interface KeyChain {
  keyChainGenerateKey: (options?: { type?: KeyType; offset: number }) => {
    secretKey: Buffer;
    type: KeyType;
  };
}

export interface Identity extends Storage, KeyChain, DataStore {
  identityCreate: (options?: {
    identifier: Omit<Identifier, 'did'>;
  }) => Promise<Identifier>;
  identityGet: (identifier: Partial<Identifier>) => string;
  identitySetService: (options?: {}) => string;
}

// Identifier

export type KeyType = 'Ed25519' | 'Secp256k1';

export interface Identifier {
  did: string;
  alias?: string;
  services?: Service[];
}

export interface Service {
  id: string;
  type: string;
  serviceEndpoint: string;
  description?: string;
}

export type PublicKey = {
  id: string;
  type: string;
  publicKeyMultibase: string;
  purposes?: KeyCapabilitySection[];
};

// Provider

export interface IdentityProvider {
  createIdentifier: {
    (options: { privateKey: Buffer; type: KeyType }): Promise<Identifier>;
  };

  // resolveIdentifier: {
  //   (identifier: Identifier): Promise<Identifier>;
  // };

  // setService: {
  //   (identifier: Identifier, service: Service): Promise<any>;
  // };
}

// SlashDID provider

export type SlashDIDBlock = {
  p?: PublicKey[];
  s?: ServiceEndpoint[];
};

export { Slashtags };
