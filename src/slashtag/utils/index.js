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
