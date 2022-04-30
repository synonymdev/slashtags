import Hyperbee from 'hyperbee';
import c from 'compact-encoding';
import Hyperblobs from 'hyperblobs';
import b4a from 'b4a';
import Debug from 'debug';
import EventEmitter from 'events';

import { ObjectMetadata } from './encoding.js';
import { collect, hash } from './utils.js';

const debug = Debug('slashtags:slashdrive');

const VERSION = '0.1.0-alpha.1';

const HeaderKeys = {
  content: 'c',
  version: 'v',
};

const SubPrefixes = {
  headers: 'h',
  objects: 'o',
};

export class SlashDrive extends EventEmitter {
  /**
   *
   * @param {object} opts
   * @param {*} opts.store
   * @param {string} [opts.name]
   * @param {Uint8Array} [opts.key]
   * @param {import('./interfaces').KeyPair} [opts.keyPair]
   * @param {boolean} [opts.encrypted]
   * @param {Uint8Array} [opts.encryptionKey]
   */
  constructor(opts) {
    super();
    this._opts = opts;

    if (!(opts.key || opts.keyPair || opts.name)) {
      throw new Error('Missing keyPair, key, or name');
    }

    this._ready = false;
  }

  async ready() {
    if (this._ready) return;

    const opts = this._opts;
    // @ts-ignore
    this._opts = undefined;

    this.writable = Boolean(opts.keyPair) || Boolean(opts.name);

    const metadataCoreOpts = this.writable
      ? await (async () => {
          const keyPair =
            opts.keyPair || (await opts.store.createKeyPair(opts.name));

          const encryptionKey = opts.encrypted && hash(keyPair.secretKey);

          return { keyPair, encryptionKey };
        })()
      : { key: opts.key, encryptionKey: opts.encryptionKey };

    this.store = opts.store.namespace(
      opts.name || opts.keyPair?.publicKey || opts.key,
    );

    const metadataCore = await this.store.get(metadataCoreOpts);
    await metadataCore.ready();

    this.key = metadataCore.key;
    this.encryptionKey = metadataCore.encryptionKey;

    this.db = new Hyperbee(metadataCore);
    this.metadata = this.db.sub(SubPrefixes.objects);
    this.headers = this.db.sub(SubPrefixes.headers);

    this.discoveryKey = metadataCore.discoveryKey;

    metadataCore.on('append', () => this.emit('update'));

    if (this.writable) {
      const contentCore = await this.store.get({
        name: 'content',
        encryptionKey: this.encryptionKey,
      });
      await contentCore.ready();

      if (!(await this.headers.get(HeaderKeys.content))) {
        const batch = this.headers.batch();
        await batch.put(HeaderKeys.content, contentCore.key);
        await batch.put(HeaderKeys.version, b4a.from(VERSION));
        await batch.flush();
      }
      this.content = new Hyperblobs(contentCore);
    }

    this._ready = true;
  }

  /**
   * Awaits for an updated length of the metdata core, and setup the content core if it doesn't already exist
   *
   */
  async update() {
    await this.ready();
    const updated = await this.metadata?.feed.update();
    await this._setupRemoteContent();
    return updated;
  }

  /**
   * Returns a callback that informs this.update() that peer discovery is done
   * more at https://github.com/hypercore-protocol/hypercore-next/#const-done--corefindingpeers
   *
   * @returns {Promise<()=>void>}
   */
  async findingPeers() {
    await this.ready();
    // @ts-ignore
    return this.metadata?.feed.findingPeers();
  }

  /**
   *
   * @param {boolean} isInitiator
   * @param {*} opts
   * @returns
   */
  replicate(isInitiator, opts) {
    return this.store.replicate(isInitiator, opts);
  }

  async _setupRemoteContent() {
    if (this.content) return;

    await validateRemote(this);
    const contentHeader = await this.headers?.get(HeaderKeys.content);
    if (!contentHeader?.value) {
      throw new Error('Missing content key in headers');
    }

    const contentCore = await this.store.get({
      key: contentHeader.value,
      encryptionKey: this.encryptionKey,
    });

    await contentCore.ready();
    this.content = new Hyperblobs(contentCore);
  }

  /**
   *
   * @param {string} key
   * @param {Uint8Array} content
   * @param {object} [options]
   * @param {object} [options.metadata]
   */
  async put(key, content, options) {
    if (!this.writable) throw new Error('Drive is not writable');
    await this.ready();
    // TODO support streamable content

    const pointer = await this.content?.put(content);
    await this.metadata?.put(
      key,
      c.encode(ObjectMetadata, {
        content: pointer,
        userMetadata: options?.metadata,
      }),
    );
  }

  /**
   *
   * @param {string} key
   * @returns
   */
  async get(key) {
    if (!this.content) await this.update();

    const block = await this.metadata?.get(key);
    if (!block) return null;

    const metadata = c.decode(ObjectMetadata, block.value);

    const blob = await this.content?.get(metadata.content);

    return blob;
  }

  /**
   *
   * @param {string} prefix
   * @returns {Promise<Array<{key:string, metadata: Object}>>}
   */
  async list(prefix) {
    await this.ready();

    const options = {
      gte: prefix,
      // TODO: works for ASCII, handle UTF-8
      lt: prefix + '~',
    };
    const stream = this.metadata?.createReadStream(options);

    // @ts-ignore
    return collect(stream, (entry) => {
      const metadata = c.decode(ObjectMetadata, entry.value);

      return {
        key: b4a.toString(entry.key),
        metadata: {
          ...metadata.userMetadata,
          contentLength: metadata.content.byteLength,
        },
      };
    });
  }
}

/**
 *
 * @param {SlashDrive} drive
 */
async function validateRemote(drive) {
  const metadataCore = drive.metadata?.feed;

  await metadataCore?.update();

  // First block is hyperbee and the second is the content header
  if (metadataCore && metadataCore.length < 2) {
    throw new Error('Could not resolve remote drive');
  }

  try {
    await drive.headers?.get(HeaderKeys.content);
  } catch (error) {
    debug(
      'Corrupted remote drive',
      'error:',
      error,
      '\ncontent header block:',
      b4a.toString(await metadataCore?.get(1)),
    );

    throw new Error('Encrypted or corrupt drive');
  }
}
