import type { FeedInfo, RespondAs, Peer } from '@synonymdev/slashtags-auth';

export type ACT1_Callbacks = {
  onRemoteVerified: (peer: Peer) => Promise<RespondAs> | RespondAs;
  onLocalVerified?: (response: {
    local: Peer;
    remote: Peer;
    feeds: FeedInfo[];
  }) => Promise<void> | void;
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
