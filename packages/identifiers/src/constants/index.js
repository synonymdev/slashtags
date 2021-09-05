import * as multihash from "multihashes";
import * as json from "multiformats/codecs/json";

export const DEFAULT_PROTOCOL = {
  code: 0,
  name: "hyperprotocol",
};

export const DEFAULT_BASE = "base64url";

export const DEFAULT_CONTENT_TYPE = json.code;

/** @type {multihash.HashCode} */
export const DEFAULT_HASH = multihash.names["sha2-256"];

export const SLASHTAGS_ID_TYPES = [
  { code: 0, name: "STCIDV0" },
  { code: 1, name: "STFIDV0" },
].reduce(
  (
    /**
     * @type {{
     *  byCode: {[code: number]: {code: number, name: string}},
     *  byName: {[name: string]: {code: number, name: string}}
     * }}
     */
    acc,
    type
  ) => {
    acc.byCode[type.code] = type;
    acc.byName[type.name] = type;

    return acc;
  },
  { byCode: {}, byName: {} }
);
