import { createContext } from 'react';
import JsonRPC from 'simple-jsonrpc-js';

const socketURL =
  window.location.hostname === 'localhost'
    ? 'ws://localhost:9002'
    : 'wss://slashtags.herokuapp.com';

let rpc;
let clientID = localStorage.getItem('clientID');

if (!clientID) {
  clientID = Math.random().toString(36).slice(2);
  localStorage.setItem('clientID', clientID);
}

export const RPC = () => {
  if (rpc) return rpc;
  const socket = new WebSocket(socketURL);
  var jrpc = new JsonRPC();

  socket.onmessage = (event) => jrpc.messageHandler(event.data);
  jrpc.toStream = (msg) => socket.send(msg);

  return new Promise((resolve, reject) => {
    socket.onopen = () => {
      rpc = jrpc;
      resolve(jrpc);
    };
  });
};

export const setupRPC = async (dispatch) => {
  const jrpc = await RPC();

  jrpc.call('clientID', { clientID });

  jrpc.on('userAuthenticated', ['user'], (user) => {
    console.log('UserAuthenticated: ', user);
    dispatch({
      type: types.SET_USER,
      user: user,
    });
  });

  jrpc.on('slashauthUrl', ['url'], (url) => {
    dispatch({
      type: types.SET_AUTH_URL,
      url,
    });
  });
};

export const initialValue = {
  loginURL: null,
  user: null,
};

export const types = {
  SET_USER: 'SET_USER',
  SET_AUTH_URL: 'SET_AUTH_URL',
};

export const reducer = (state, action) => {
  let result = { ...state };

  switch (action.type) {
    case types.SET_AUTH_URL:
      result = { ...state, authURL: action.url };
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
