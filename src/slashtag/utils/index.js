import crypto from 'crypto';
import base64url from 'base64url';

/**
 * @type {(data: Serializable|string)=> string}
 */
export const recordID = (data) =>
  typeof data === 'string'
    ? data
    : base64url.fromBase64(
        crypto
          .createHash('sha256')
          .update(JSON.stringify(data))
          .digest('base64'),
      );

/**
 * Create a slashtag uri from both a schemaID and a recordID
 *  and an optional key in the resolved and parsed document.
 * @type {(schemaID:string, recordID:string, key?:string )=> string}
 */
export const slashtagURI = (schemaID, recordID, key) =>
  `did:slash:${schemaID}/${recordID}/` + (key ? '#' + key : '');
