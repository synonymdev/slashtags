import EventEmitter from 'events';
import { DHT } from 'dht-universal';
import Hyperswarm from 'hyperswarm';
import Debug from 'debug';
import b4a from 'b4a';

import { randomBytes, createKeyPair } from './crypto.js';
import { catchConnection } from './utils.js';

const debug = Debug('slashtags:slashtag');

export class Slashtag extends EventEmitter {
  /**
   *
   * @param {object} opts
   * @param {Uint8Array} [opts.key]
   * @param {import('./interfaces').KeyPair} [opts.keyPair]
   *
   * @param {object} [opts.swarmOpts]
   * @param {string[]} [opts.swarmOpts.relays]
   * @param {Array<{host: string; port: number}>} [opts.swarmOpts.bootstrap]
   */
  constructor(opts = {}) {
    super();

    this.keyPair = opts.keyPair;
    this.remote = !this.keyPair;
    this.key = opts.keyPair?.publicKey || opts.key;

    this._swarmOpts = opts.swarmOpts;

    if (!this.key) throw new Error('Missing keyPair or key');
  }

  async ready() {
    if (this._ready) return true;

    if (!this.remote) {
      const dht = await DHT.create({ ...this._swarmOpts });
      this.swarm = new Hyperswarm({
        ...this._swarmOpts,
        keyPair: this.keyPair,
        dht,
      });
      this.swarm.on('connection', this._handleConnection.bind(this));
    }

    this._ready = true;
  }

  /**
   * Augment Server and client's connections with Slashtag protocols and peerInfo.slashtag.
   *
   * @param {*} socket
   * @param {PeerInfo} peerInfo
   */
  async _handleConnection(socket, peerInfo) {
    peerInfo.slashtag = new Slashtag({ key: peerInfo.publicKey });

    // const info = { local: this.url, remote: peerInfo.slashtag.url };

    // debug('Swarm connection OPENED', info);
    // socket.on('error', function (err) {
    // debug('Swarm connection ERRORED', err, info);
    // });
    // socket.on('close', function () {
    // debug('Swarm connection CLOSED', info);
    // });

    // this._setupProtocols(socket, peerInfo);
    this.emit('connection', socket, peerInfo);
  }

  async listen() {
    if (this.remote) throw new Error('Cannot listen on a remote slashtag');
    await this.ready();

    // @ts-ignore After the ready() call, this.swarm is set
    return this.swarm.listen();
  }

  /**
   * Connect to a remote Slashtag.
   *
   * @param {Uint8Array} key
   * @returns {Promise<{connection: SecretStream, peerInfo:PeerInfo}>}
   */
  async connect(key) {
    if (this.remote) throw new Error('Cannot connect from a remote slashtag');
    if (b4a.equals(key, this.key)) throw new Error('Cannot connect to self');
    await this.ready();

    let connection = this.swarm?._allConnections.get(key);
    if (!!connection) {
      return {
        connection,
        peerInfo: this.swarm?.peers.get(b4a.toString(key, 'hex')),
      };
    }

    connection = this.swarm && catchConnection(this.swarm, key);

    this.swarm?.joinPeer(key);
    return connection;
  }

  async close() {
    await this.ready();
    await this.swarm?.destroy();
    this.emit('close');
  }

  /**
   * Generates a Slashtags KeyPair, randomly or optionally from primary key and a name.
   *
   * @param {Uint8Array} [primaryKey]
   * @param {string} [name]
   */
  static createKeyPair(primaryKey = randomBytes(), name = '') {
    return createKeyPair(primaryKey, name);
  }
}

/**
 * @typedef {import('./interfaces').PeerInfo } PeerInfo
 * @typedef {import('./interfaces').SecretStream } SecretStream
 */
