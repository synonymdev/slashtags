import { format, parse } from './index.js';
import * as FeedID from '@synonymdev/slashtags-docid';

/**
 * @class
 * @param {Object} opts
 * @param {{createServer: () => void, connect: (feedKey:string |Uint8Array) => Promise<void>}} opts.node
 */
export function Actions(opts) {
  if (!(this instanceof Actions)) return new Actions(opts);

  let _server;
  let _feedKey;
  /** @type {Record<number, ()=>{}>} */
  const actions = {};

  return {
    getURL: () => {
      if (!_feedKey) {
        _server = opts.node.createServer();
      }

      return format({ feedID: FeedID.create(0, _feedKey) });
    },

    /**
     *
     * @param {string} url
     */
    request: async (url) => {
      const { feedID } = parse(url);
      if (feedID) return;
      await opts.node.connect(feedID?.bytes hostname);
    },

    /**
     *
     * @param {Array<{ act:number, handler:()=>{} }>} handlers
     */
    use: (handlers) =>
      handlers.forEach((handler) => (actions[handler.act] = handler.handler)),
  };
}

const acts = new Actions({
  node: { createServer: () => {}, connect: () => {} },
});

console.log(acts.getURL());
