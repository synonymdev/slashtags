import { createContext } from 'react';
import { secp256k1 as curve } from 'noise-curve-tiny-secp';
import faker from 'faker';
import { didKeyFromPubKey } from '@synonymdev/slashtags-auth';
import { Core } from '@synonymdev/slashtags-core';
import { Actions } from '@synonymdev/slashtags-actions';
import { Auth } from '@synonymdev/slashtags-auth';

const node = Core({ relays: ['wss://dht-relay.synonym.to/'] });

export const initialValue = {
  dependencies: {
    actions: node.then((n) => Actions(n)),
    auth: node.then((n) => Auth(n)),
  },
  view: 'home',
  prompt: null,
  personas: Array(3)
    .fill(0)
    .map(
      /** @returns {import ('@synonymdev/slashtags-auth').PeerConfig} */
      (_, i) => {
        const keyPair = curve.generateSeedKeyPair(i.toString());
        const id = didKeyFromPubKey(keyPair.publicKey);
        return {
          keyPair,
          profile: {
            '@context': 'https://schema.org',
            '@type': 'Person',
            '@id': id,
            name: faker.name.findName(),
            url: faker.internet.url(),
          },
        };
      },
    ),
  connections: {},
};

export const types = {
  SET_VIEW: 'SET_VIEW',
  SET_PROMPT: 'SET_PROMPT',
  ADD_CONNECTION: 'ADD_CONNECTION',
  SET_PROFILE: 'SET_PROFILE',
  AUTH_QR: 'AUTH_QR',
};

export const reducer = (state, action) => {
  let result = { ...state };
  switch (action.type) {
    case types.SET_VIEW:
      result = { ...state, view: action.view };
      break;
    case types.SET_PROMPT:
      result = { ...state, prompt: action.prompt };
      break;
    case types.ADD_CONNECTION:
      console.log({ action });
      result = {
        ...state,
        connections: {
          ...state.connections,
          [action.connection.local['@id']]: {
            persona: action.connection.local,
            remotes: {
              ...(state.connections[action.connection.local['@id']]?.remotes ||
                {}),
              [action.connection.remote['@id']]: action.connection.remote,
            },
          },
        },
        view: 'home',
        prompt: null,
      };
      break;
    case types.SET_PROFILE:
      result = { ...state, view: 'profile', profile: action.profile };
      break;
    case types.AUTH_QR:
      result = {
        ...state,
        view: 'authQR',
        responder: action.persona,
      };
      break;
    default:
      break;
  }

  console.log('store', result);
  return result;
};

export const StoreContext = createContext(initialValue);
