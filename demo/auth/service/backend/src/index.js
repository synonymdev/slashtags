import websocket from 'isomorphic-ws';
import { serverProfile } from './profile.js';
import jrpcLite from 'jsonrpc-lite';
import { randomBytes } from 'crypto';
import { SDK } from '../../../../../packages/sdk/src/index.js';
import { fastify } from 'fastify';
import Dotenv from 'dotenv';
import Debug from 'debug';
import { SlashAuth } from '../../../../../packages/auth/src/index.js';

const debug = Debug('slashtags:demo:auth:server');

Dotenv.config({ path: '../../../../.env' });
const bootstrap = JSON.parse(process.env.BOOTSTRAP);

let slashtag;

async function setupSlashtagsAuth() {
  // Setup SDK
  const sdk = await SDK.init({
    bootstrap,
    seed: Buffer.from(
      'b61e363cdcf522e530ef67955ef342733d1ac85063b55bd6c836f68124b8a17b',
      'hex',
    ),
  });

  // Create server's slashtag
  slashtag = sdk.slashtag({ name: 'Slashtags Demo' });
  debug("Servers's slashtag url: ", slashtag.url);

  await slashtag.setProfile(serverProfile(slashtag.url));

  const auth = slashtag.registerProtocol(SlashAuth);

  auth.on('request', async (request, response) => {
    debug('Got slashauth sessionID', request.token);

    let remoteProfile;

    try {
      const remoteSlashtag = request.peerInfo.slashtag;
      await remoteSlashtag.ready();
      remoteProfile = await remoteSlashtag.getProfile();
    } catch {
      response.error(
        new Error('Could not resolve your profile ... can not sign in'),
      );
      return;
    }

    try {
      authorize(request.token, remoteProfile);
      response.success();
    } catch (e) {
      response.error(e.message);
    }
  });

  auth.listen();
}

const sessions = new Map();

function authorize(sessionID, remoteProfile) {
  const socket = sessions.get(sessionID);
  debug('Got valid session', sessionID);
  if (socket) {
    socket.send(
      jrpcLite
        .notification('userAuthenticated', { user: remoteProfile })
        .serialize(),
    );
  }
}

function webServer() {
  const app = fastify();
  const PORT = Number(process.env.PORT) || 9000;
  const hostanme = 'localhost' || 'slashtags.herokuapp.com';

  const wss = new websocket.Server({ host: hostanme, port: PORT + 2 });

  wss.on('connection', (socket) => {
    const sessionID = randomBytes(8).toString('base64');
    sessions.set(sessionID, socket);

    wss.on('close', () => {
      sessions.delete(sessionID);
    });

    debug('Client connected: ', sessionID);

    socket.send(
      jrpcLite
        .notification('slashauthUrl', {
          url:
            slashtag.url.replace('slash://', 'slashauth://') +
            '?q=' +
            sessionID,
        })
        .serialize(),
    );
  });

  debug(`Server is now listenng on port ${PORT + 2}`);

  app.listen(PORT, function (err, address) {});
}

(async () => {
  await setupSlashtagsAuth();
  webServer();
})();
