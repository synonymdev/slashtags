import type { Profile, Responder } from '@synonymdev/slashtags-auth';
import type { JsonLdObject } from '@synonymdev/slashtags-common';
import type { SlashtagsAPI } from '@synonymdev/slashtags-core';

export type ACT1_InitialResponseResult = {
  initiator: Responder;
  additionalItems?: JsonLdObject[];
};

export type ACT1_Callbacks = {
  onResponse: (
    remotePeer: Profile,
    additionalItems?: JsonLdObject[],
  ) => Promise<ACT1_InitialResponseResult> | ACT1_InitialResponseResult;
  onSuccess: (
    connection: {
      local: Profile;
      remote: Profile;
    },
    additionalItems: JsonLdObject[],
  ) => Promise<void> | void;
};

export type CallBacks = {
  ACT1?: ACT1_Callbacks;
  [key: string]: any;
};

export type OnError = (error: {
  code:
    | 'MalformedURL'
    | 'UnsupportedAction'
    | 'Unknown'
    | 'TicketNotFound'
    | 'InvalidSessionFingerprint';
  message?: string;
  url: string;
}) => void | Promise<void>;

export type ActionImplementation = (params: {
  node: SlashtagsAPI;
  address: Uint8Array;
  callbacks: CallBacks;
  tkt: string;
  [key: string]: any;
}) => Promise<void>;
