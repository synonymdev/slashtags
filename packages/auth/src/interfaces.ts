import type { KeyPair, JsonLdObject } from '@synonymdev/slashtags-common'
import type { Thing, WithContext } from 'schema-dts'
export type { SlashtagsRPC } from '@synonymdev/slashtags-rpc'
export type { JsonLdObject } from '@synonymdev/slashtags-common'

export declare type Profile = WithContext<Thing> & { '@id': string }

export interface PeerConfig {
  profile: Profile
  keyPair: KeyPair
  keyPairType?: 'ES256K' | 'EdDSA'
}

export interface InitialResponse {
  responder: PeerConfig
  additionalItems?: JsonLdObject[]
}

export interface OnRequest { (): Promise<InitialResponse> | InitialResponse }

export interface VerifySuccess { additionalItems?: JsonLdObject[] }
export interface OnSuccess {
  (connection: {
    local: Profile
    remote: Profile
  }, additionalItems: JsonLdObject[]): VerifySuccess | Promise<VerifySuccess> | Promise<void>
}

export interface TicketConfig {
  onRequest: OnRequest
  onSuccess?: OnSuccess
  sfp?: string
  local?: Profile
}
