import { createContext } from 'react';
import { RPC } from './jrpc';

export const setupRPC = async (dispatch) => {
  const jrpc = await RPC();

  jrpc.call('ping').then((result) => console.log('ping: ' + result));

  jrpc.on('userAuthenticated', ['user'], (user) => {
    console.log('UserAuthenticated: ', user);
    dispatch({
      type: types.SET_USER,
      user: user,
    });
  });
};

export const getTicket = async (dispatch) => {
  const jrpc = await RPC();
  const url = await jrpc.call('authUrl');
  dispatch({ type: types.SET_TICKET, url });

  jrpc.on('authUrlExpired', ['user'], async () => {
    const url = await jrpc.call('authUrl');
    dispatch({ type: types.SET_TICKET, url });
  });
};

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
