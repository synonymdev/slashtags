import React from 'react';
import ReactDOM from 'react-dom';
import './styles/index.css';
import { App } from './containers/App';
import { SlashActions } from '@synonymdev/slashtags-actions';
import { Core } from '@synonymdev/slashtags-core';
import { secp256k1 } from 'noise-curve-tiny-secp';

const keyPair = secp256k1.generateSeedKeyPair('seed');
const metadata = { foo: 'bar' };

window.run = async (url) => {
  const node = await Core();

  const slashActs = SlashActions({ node });

  return await slashActs.handle(url, {
    ACT_1: {
      onChallenge: ({}) => {
        return { metadata, keyPair };
      },
      onSuccess: (stuff) => {
        console.log('success', stuff);
      },
      onError: (err) => {
        console.log('got error', err);
      },
    },
  });
};

ReactDOM.render(
  <React.StrictMode>{<App />}</React.StrictMode>,
  document.getElementById('root'),
);
