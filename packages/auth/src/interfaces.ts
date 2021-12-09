import type { Signer } from 'did-jwt';

import type { KeyPair } from '@synonymdev/slashtags-common';
export type { SlashtagsRPC } from '@synonymdev/slashtags-rpc';
import type { WithContext, Person, Organization } from 'schema-dts';

export type FeedInfo = {
  name: string;
  schema: string;
  src: string;
};

export type VerifySuccess = {
  feeds: FeedInfo[];
};

export type Peer = PeerMetadata & { '@id': string };

export type OnVerify = (peer: Peer) => VerifySuccess | Promise<VerifySuccess>;

export type RespondAs = {
  metadata: PeerMetadata;
  signer: {
    keyPair: KeyPair;
    type?: 'ES256K' | 'EdDSA';
  };
};

export type TicketConfig = {
  onVerify?: OnVerify;
  peer: Peer;
  sfp?: string;
  signer: Signer;
};

export type PeerMetadata = WithContext<Person | Organization>;
