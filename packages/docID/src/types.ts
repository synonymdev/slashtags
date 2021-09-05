import { DocTypeName, DocMutability } from "./constants";

export interface DocType {
  code: number;
  name: DocTypeName;
  mutability: DocMutability;
}

export interface DocID {
  type: DocType;
  bytes: Uint8Array;
}

export interface ParsedDocID {
  type: DocType;
  identifyingBytes: Uint8Array;
}
