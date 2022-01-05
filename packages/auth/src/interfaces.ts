import type { KeyPair, JsonLdObject } from '@synonymdev/slashtags-common';
export type { SlashtagsRPC } from '@synonymdev/slashtags-rpc';
export type { JsonLdObject } from '@synonymdev/slashtags-common';
import type { Thing, WithContext } from 'schema-dts';

export declare type Profile = WithContext<Thing> & { '@id': string };

export type PeerConfig = {
  profile: Profile;
  keyPair: KeyPair;
  keyPairType?: 'ES256K' | 'EdDSA';
};

export type InitialResponse = {
  responder: PeerConfig;
  additionalItems?: JsonLdObject[];
};

export type OnRequest = () => Promise<InitialResponse> | InitialResponse;

export type VerifySuccess = { additionalItems?: JsonLdObject[] };
export type OnSuccess = (
  connection: {
    local: Profile;
    remote: Profile;
  },
  additionalItems: JsonLdObject[],
) => VerifySuccess | void | Promise<VerifySuccess> | Promise<void>;

export type TicketConfig = {
  onRequest: OnRequest;
  onSuccess?: OnSuccess;
  sfp?: string;
  local?: Profile;
};
