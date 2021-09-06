import { bases } from "multiformats/basics";
import { bytes } from "multiformats";

/**
 * Takes a Uint8Array or string encoded with multibase header, decodes it and
 * returns the decoded buffer
 *
 * @param {string | Uint8Array} input
 * @returns {Uint8Array}
 */
export const wildDecode = (input) => {
  if (input instanceof Uint8Array) input = bytes.toString(input);

  const enc = Object.entries(bases).filter(
    (base) => base[1].prefix === input[0]
  );

  if (enc.length === 0) throw new Error(`Unsupported encoding: ${input[0]}`);

  return enc[0][1].decoder.decode(input);
};
