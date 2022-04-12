import { createContext } from 'react';
import * as falso from '@ngneat/falso';
import { SDK } from '../../../../packages/sdk/src/index.js';
import { SlashAuth } from '../../../../packages/auth/src/index.js';
import randomBytes from 'randombytes';

import b4a from 'b4a';
import Debug from 'debug';

const log = Debug('slashtags:demo:wallet');

const sdk = (async () => {
  console.log('sdk again ');
  let primaryKey = localStorage.getItem('primaryKey');
  log('Stored primaryKey', primaryKey);
  if (primaryKey) {
    primaryKey = Buffer.from(primaryKey, 'hex');
  } else {
    primaryKey = randomBytes(32);
    localStorage.setItem('primaryKey', b4a.toString(primaryKey, 'hex'));
  }

  const sdk = await SDK.init({
    primaryKey,
    relays: ['ws://localhost:8888'],
  });

  return sdk;
})();

let user = sdk.then(async (sdk) => {
  const name = window.location.pathname;
  const slashtag = await sdk.slashtag({ name });

  const profile = {
    id: slashtag.url,
    type: 'Person',
    name: falso.randFullName(),
    url: falso.randUrl(),
    email: falso.randEmail(),
  };

  await slashtag.setProfile(profile);

  log('Created a slashtag', slashtag.url);

  return slashtag;
});

const auth = user.then((slashtag) => {
  return slashtag.registerProtocol(SlashAuth);
});

export const initialValue = {
  sdk,
  currentUser: user,
  auth,
  view: 'home',
  viewOptions: {},
  accounts: [],
  contacts: [],
};

log('InitialValue', initialValue);

export const types = {
  SET_VIEW: 'SET_VIEW',
  ADD_ACCOUNT: 'ADD_ACCOUNT',
  ADD_CONTACT: 'ADD_CONTACT',
};

export const reducer = (state, action) => {
  let result = { ...state };
  switch (action.type) {
    case types.SET_VIEW:
      result = {
        ...state,
        view: action.view,
        viewOptions: action.viewOptions || {},
      };
      break;
    case types.ADD_ACCOUNT:
      result = {
        ...state,
        view: 'home',
        accounts: [
          ...state.accounts
            .map((account) => account.id !== action.account.id)
            .filter(Boolean),
          action.account,
        ],
      };
      break;
    case types.ADD_CONTACT:
      result = {
        ...state,
        view: 'home',
        contacts: [
          ...state.contacts
            .map((contact) => contact.id !== action.contact.id)
            .filter(Boolean),
          action.contact,
        ],
      };
      break;
    default:
      break;
  }

  log('Store update\n  ', action, '\n  ', result);
  return result;
};

export const StoreContext = createContext(initialValue);
