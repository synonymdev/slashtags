import { createContext } from 'react';
import { secp256k1 as curve } from 'noise-curve-tiny-secp';
import faker from 'faker';

export const initialValue = {
  view: 'home',
  prompt: null,
  profiles: Array(3)
    .fill(0)
    .map((_, i) => ({
      keyPair: curve.generateSeedKeyPair(i.toString()),
      metadata: {
        name: faker.name.findName(),
        image: faker.image.avatar(),
        url: faker.internet.url(),
      },
    })),
  accounts: {},
};

export const types = {
  SET_VIEW: 'SET_VIEW',
  SET_PROMPT: 'SET_PROMPT',
  ADD_ACCOUNT: 'ADD_ACCOUNT',
  SET_ACCOUNT: 'SET_ACCOUNT',
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
    case types.ADD_ACCOUNT:
      result = {
        ...state,
        accounts: {
          ...state.accounts,
          [action.account.service.publicKey]: {
            ...state.accounts[action.account.service.publicKey],
            [action.account.profile.publicKey]: action.account,
          },
        },
        view: 'home',
        prompt: null,
      };
      break;
    case types.SET_ACCOUNT:
      result = { ...state, view: 'account', account: action.account };
      break;
    default:
      break;
  }

  console.log('store', result);
  return result;
};

export const StoreContext = createContext(initialValue);
