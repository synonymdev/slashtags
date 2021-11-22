import { PROTOCOL_NAME } from './constants.js';
import * as json from 'multiformats/codecs/json';
import { base64url } from 'multiformats/bases/base64';
import { varint } from '@synonymdev/slashtags-common';
import { validate } from './validate.js';

/**
 * Create Document base URLs or Action URL
 * @param {string | *} docID DocumentID
 * @param {object} [actionPayload] Payload for slashtags actions
 * @param {boolean} [throwInvalid=false] Throw error on invalid payload
 * @throws {Error} Throws erros for invalid payload
 * @returns {string}
 */
export const format = (docID, actionPayload, throwInvalid = false) => {
  if (actionPayload) {
    // Remove additional fields
    actionPayload = validate(docID, actionPayload, throwInvalid);

    const jsonEncoded = json.encode(actionPayload);
    const payload = base64url.encode(varint.prepend([json.code], jsonEncoded));
    const url = PROTOCOL_NAME + `:${docID}/#${payload}`;

    if (url.length > 2000) {
      throw new Error(
        'Payload is too big, url max length should be 2000 character, got: ' +
          url.length,
      );
    }

    return url;
  }

  return PROTOCOL_NAME + `://${docID}/`;
};
