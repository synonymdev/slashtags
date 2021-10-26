import { Core } from '@synonymdev/slashtags-core';
import { SlashtagsActions } from '../src/index.js';

const node = Core();

const slashActions = SlashtagsActions({ node });

slashActions.handle('...', {
  ACT_1: {
    onChallenge: ({ publicKey, image }) => {
      return {
        keyPair: {
          publicKey: Buffer.from(''),
          secretKey: Buffer.from(''),
        },
        metadata: { name: 'arst', image: 'arst' },
      };
    },
  },
});
