import { createContext } from 'react';
import { JohnImage } from './constants';
import { secp256k1 as curve } from 'noise-curve-tiny-secp';

export const initialValue = {
  veiw: 'home',
  prompt: null,
  profiles: [
    {
      keyPair: curve.generateSeedKeyPair('john'),
      metadata: {
        name: 'John Carvalho',
        image: JohnImage,
      },
    },
  ],
  accounts: [],
};

export const types = {
  SET_VIEW: 'SET_VIEW',
  SET_PROMPT: 'SET_PROMPT',
  SET_ACCOUNT: 'SET_ACCOUNT',
  // SET_USER: 'SET_USER',
  // CHALLENGE: 'CHALLENGE',
  // EXPECT_CONTACT: 'EXPECT_CONTACT',
  // ADD_CONTACT: 'ADD_CONTACT',
  // SET_CONNECTING_STEP: 'SET_CONNECTING_STEP',
  // ADD_TO_CONTACTS: 'ADD_TO_CONTACTS',
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
    case types.SET_ACCOUNT:
      result = {
        ...state,
        accounts: [...state.accounts, action.account],
        view: 'home',
        prompt: null,
      };
      break;
    // case types.SET_USER:
    //   const auth = createAuth(action.keypair, {
    //     metadata: { title: action.user.title, image: action.user.image },
    //   });
    //   result = { ...state, user: action.user, auth };
    //   break;
    // case types.SET_VIEW:
    //   result = { ...state, view: action.view };
    //   break;
    // case types.EXPECT_CONTACT:
    //   break;
    // case types.ADD_CONTACT:
    //   result = {
    //     ...state,
    //     view: 'connecting',
    //     connecting: { step: 0, initiator: true },
    //   };
    //   break;
    // case types.SET_CONNECTING_STEP:
    //   result = {
    //     ...state,
    //     view: 'connecting',
    //     connecting: {
    //       ...state.connecting,
    //       step: Math.max(state.connecting.step, action.step),
    //       pk: state.connecting.pk || action.pk,
    //     },
    //   };
    //   break;
    // case types.ADD_TO_CONTACTS:
    //   result = {
    //     ...state,
    //     contacts: [action.peer],
    //   };
    default:
      break;
  }

  console.log('store', result);
  return result;
};

export const StoreContext = createContext(initialValue);
