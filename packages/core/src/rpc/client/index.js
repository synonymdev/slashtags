import simple_jsonrpc from 'simple-jsonrpc-js';
import websocket from 'isomorphic-ws';
import LRU from 'lru';

// Close websockets if are not used for more than 60 seconds
const websocket_cache = new LRU({ maxAge: 10 * 60 });
websocket_cache.on(
  'evict',
  /** @param {{key: string, value: import ('isomorphic-ws')}} data */
  (data) => {
    data.value.close();
  },
);

/**
 *
 * @param {string} address
 * @param {string} method
 * @param {JSON} params
 * @returns
 */
export const request = (address, method, params) => {
  /** @type {import('isomorphic-ws')} */
  let ws;

  if (websocket_cache.peek(address)) {
    ws = websocket_cache.get(address);
    console.log('reusing websocket', address, websocket_cache.length);
  } else {
    ws = new websocket(address);
    websocket_cache.set(address, ws);
    console.log('new websocket', address, websocket_cache.length);
  }

  const jrpc = new simple_jsonrpc();

  /** @param {string} _msg */
  jrpc.toStream = (_msg) => ws.send(_msg);

  ws.onmessage = (event) => jrpc.messageHandler(event.data);

  return new Promise((resolve, reject) => {
    ws.onopen = function open() {
      jrpc
        .call(method, params)
        // @ts-ignore
        .then((result) => resolve(result))
        // @ts-ignore
        .catch((error) => resolve(error));
    };
  });
};

/** @typedef {import ('json-rpc-engine').JsonRpcRequest<JSON>} JsonRpcRequest */
/** @typedef {import('../../interfaces').JSON} JSON */
