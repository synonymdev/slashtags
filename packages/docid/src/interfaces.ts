import type { DocTypeName, DocMutability } from './constants';
import type { MultibaseEncoder as _MultibaseEncoder } from 'multiformats/bases/interface';

export type MultibaseEncoder = _MultibaseEncoder<any>;

export interface DocType {
  code: number;
  name: DocTypeName;
  mutability: DocMutability;
}

export interface DocID {
  type: DocType;
  bytes: Uint8Array;
  key: Uint8Array;
}
