import base64url from 'base64url';

const PREFIX = 'slashtag:';

/**
 * @type {{[methodName: string]: number}}
 */
const METHOD_CODES = {
  recordURI: 0,
};

/**
 * @type {{[methodName: number]: string}}
 */
const METHOD_NAMES = {
  0: 'recordURI',
};

/**
 * @param {{version?: number, methodName?: string, params?: Record<string, Serializable>}} config
 * @returns {string}
 */
export const encode = ({
  version = 0,
  methodName = 'recordURI',
  params = { type: 'builtin', name: 'blank' },
}) => {
  return (
    'slashtag:' +
    base64url.encode(
      JSON.stringify([version, METHOD_CODES[methodName], params]),
    )
  );
};

/**
 * @param {string} slashtagURI
 * @returns {{version: number, methodName: string, params: Record<string, Serializable>}}
 */
export const decode = (slashtagURI) => {
  if (!slashtagURI.startsWith(PREFIX)) throw new Error('Not a slashtag URI');

  const parsed = JSON.parse(base64url.decode(slashtagURI.slice(PREFIX.length)));
  return {
    version: parsed[0],
    methodName: METHOD_NAMES[parsed[1]],
    params: parsed[2],
  };
};
