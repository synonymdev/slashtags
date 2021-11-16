import { createContext } from 'react';
import { RPC } from './jrpc';

export const setupRPC = async (dispatch) => {
  const jrpc = await RPC();

  //calls
  jrpc.call('ping').then((result) => console.log('ping: ' + result));

  jrpc.on(
    'UserAuthenticated',
    ['publicKey', 'metadata'],
    (publicKey, metadata) => {
      console.log('UserAuthenticated: ' + publicKey + ' ' + metadata);
      dispatch({
        type: types.SET_USER,
        user: { publicKey, metadata },
      });
    },
  );
};

export const getTiceket = async (dispatch) => {
  const jrpc = await RPC();

  const url = await jrpc.call('REQUEST_ACCOUNTS_URL');

  dispatch({ type: types.SET_TICKET, url });
};

// const createServerPayload = () => {
//   const challenge = responder.newChallenge(3600000).toString('hex');

//   return {
//     publicKey: serverKeypair.publicKey.toString('hex'),
//     challenge,
//   };
// };

export const initialValue = {
  loginURL: null,
  user: null,
};

export const types = {
  SET_TICKET: 'SET_TICKET',
  SET_USER: 'SET_USER',
};

export const reducer = (state, action) => {
  let result = { ...state };

  switch (action.type) {
    case types.SET_TICKET:
      result = { ...state, loginURL: action.url };
      break;
    case types.SET_USER:
      result = { ...state, user: action.user };
      break;

    default:
      break;
  }

  console.log('\nStore update:', result);
  return result;
};

export const StoreContext = createContext(initialValue);
