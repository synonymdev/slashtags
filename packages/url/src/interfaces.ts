export type { DocID } from '@synonymdev/slashtags-docid/types/DocID';
export type { SchemaObject as Schema } from 'ajv';

import type { DocID } from '@synonymdev/slashtags-docid/types/DocID';

export interface SlashtagsURL extends URL {
  docID: DocID;
  actionID?: string;
  payload?: object;
}
