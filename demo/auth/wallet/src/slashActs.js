// @ts-ignore
import URI from 'urijs';
import { base32 } from 'multiformats/bases/base32';
import { varint } from '@synonymdev/slashtags-common';
// import { Core } from '../../../../packages/core/dist';
import ws from 'isomorphic-ws';

export const parseURL = (url) => {
  const uri = new URI(url);

  const query = URI.parseQuery(uri.query());

  return { hostname: uri._parts.hostname, query };
};

const processAddress = (address) => {
  const bytes = base32.decode(address);

  let [_, rest, __] = varint.split(bytes);
  [_, rest] = varint.split(rest);
  [_, rest] = varint.split(rest);

  return new URL(Buffer.from(rest).toString()).toString();
};

window.run = () => {
  const url =
    'slash://b2iaqaadxom5c6l3mn5rwc3din5zxiorzgayda/?act=1&tkt=zqsD7mmoFyg';
  const { hostname, query } = parseURL(url);

  const wsURL = processAddress(hostname);

  console.log(Core
  const wss = new ws(wsURL);

  wss.onmessage = ({ data }) => {
    console.log('got', data);
  };
  wss.onopen = ({ target: socket }) => {
    socket.send('lol');
  };

  return wsURL;
};
