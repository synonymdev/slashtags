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
        type: types.USER_AUTHENTICATED,
        user: { publicKey, metadata },
      });
    },
  );
};

export const getTiceket = async (dispatch) => {
  const jrpc = await RPC();

  const url = await jrpc.call('ACT_1/REQUEST_TICKET', []);

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
  USER_AUTHENTICATED: 'USER_AUTHENTICATED',
};

export const reducer = (state, action) => {
  let result = { ...state };

  switch (action.type) {
    case types.SET_TICKET:
      result = { ...state, loginURL: action.url };
      break;
    case types.USER_AUTHENTICATED:
      result = { ...state, user: action.user };
      break;

    default:
      break;
  }

  console.log('\nStore update:', result);
  return result;
};

export const StoreContext = createContext(initialValue);
