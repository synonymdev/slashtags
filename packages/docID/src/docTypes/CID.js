import { create } from "../DocID.js";
import { CID } from "multiformats/cid";
import { sha256 } from "multiformats/hashes/sha2";
import { digest } from "multiformats";
import crypto from "crypto";
import * as json from "multiformats/codecs/json";

/**
 * Create a DocID with type CID
 * Encoded as json and hashed with sha256
 * @param {object} doc
 * @returns {DocID}
 */
export const createCID = (doc) => {
  const bytes = json.encode(doc);
  const hash = digest.create(
    sha256.code,
    crypto.createHash("sha256").update(bytes).digest()
  );
  const cid = CID.create(1, json.code, hash);
  return create(0, cid.bytes);
};

/** @typedef {import("../types").DocID} DocID */
