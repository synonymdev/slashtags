import type { KeyPair, JsonLdObject } from '@synonymdev/slashtags-common';
export type { SlashtagsRPC } from '@synonymdev/slashtags-rpc';
export type { JsonLdObject } from '@synonymdev/slashtags-common';
import type { Thing, WithContext } from 'schema-dts';

export declare type Profile = WithContext<Thing> & { '@id': string };

export type Responder = {
  profile: Profile;
  keyPair: KeyPair;
  keyPairType?: 'ES256K' | 'EdDSA';
};

export type InitialResponse = {
  responder: Responder;
  additionalItems?: JsonLdObject[];
};

export type OnInit = () => Promise<InitialResponse> | InitialResponse;

export type OnVerify = (
  peer: Profile,
  additionalItems?: JsonLdObject[],
) => VerifySuccess | Promise<VerifySuccess>;

export type TicketConfig = {
  onInit: OnInit;
  onVerify?: OnVerify;
  sfp?: string;
};

export type VerifySuccess = { additionalItems?: JsonLdObject[] };
