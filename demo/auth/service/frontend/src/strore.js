import { createContext } from 'react';
import { RPC } from './websocket';

const jrpc = RPC();

export const getTiceket = async (dispatch) => {
  const url = await jrpc.call('ACT_1/GET_TICKET', []);
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
  // attestation: null,
  // walletView: 'Account',
  // websiteView: 'Home',
};

export const types = {
  SET_TICKET: 'SET_TICKET',
  // SET_URL: 'SET_URL',
  // SET_PARSED: 'SET_PARSED',
  // SET_ATTESTATION: 'SET_ATTESTATION',
  // SET_SERVER_DATA: 'SET_SERVER_DATA',
  // SET_WALLET_VIEW: 'SET_WALLET_VIEW',
  // GET_ACCOUNT: 'GET_ACCOUNT',
  // SET_WEBSITE_VIEW: 'SET_WEBSITE_VIEW',
  // SET_FORM_DATA: 'SET_FORM_DATA',
};

// const memo = {};
// const verifyInitiator = (msg) => {
//   if (memo.msg) return memo.msg;

//   const result = responder.verifyInitiator(msg);
//   memo.msg = result;

//   return result;
// };

// const account = () => ({
//   schema: {
//     title: 'An account form',
//     description: 'A simple form example.',
//     type: 'object',
//     properties: {
//       accountName: {
//         type: 'string',
//         title: 'Account Name',
//       },
//       balance: {
//         type: 'number',
//         title: 'Account Balance',
//       },
//       userName: {
//         type: 'string',
//         title: 'Username',
//       },
//       connected: {
//         type: 'string',
//         title: 'Connected',
//         format: 'date-time',
//       },
//       tags: {
//         title: 'Tags',
//         type: 'array',
//         items: {
//           type: 'string',
//         },
//       },
//     },
//   },
//   data: {
//     accountName: 'John Carvalho',
//     userName: 'BitcoinErrorLog',
//     connected: '2021-09-23T09:45:08.368Z',
//     balance: 1456853,
//     tags: ['bitcoin', 'entertainment', 'food'],
//   },
// });

export const reducer = (state, action) => {
  let result = { ...state };

  switch (action.type) {
    case types.SET_TICKET:
      result = { ...state, loginURL: action.url };
      break;
    // case types.SET_PARSED:
    //   return { ...state, parsed: action.parsed };
    // case types.SET_SERVER_PAYLOAD:
    //   return { ...state, serverPayload: createServerPayload() };
    // case types.SET_URL:
    //   return { ...state, url: action.url };
    // case types.SET_WALLET_VIEW:
    //   return { ...state, walletView: action.walletView };
    // case types.SET_WEBSITE_VIEW:
    //   return { ...state, websiteView: action.websiteView };
    // case types.SET_ATTESTATION:
    //   const { metadata, initiatorPK, responderAttestation } = verifyInitiator(
    //     Buffer.from(action.attestation, 'hex'),
    //   );

    //   console.log("\n@ App: Verified user's attestation:", {
    //     metadata,
    //     initiatorPK: Buffer.from(initiatorPK).toString('hex'),
    //   });

    //   console.log('\nApp ==>> Wallet respond to cbURL:', {
    //     responderAttestation: Buffer.from(responderAttestation).toString('hex'),
    //   });

    //   return {
    //     ...state,
    //     user: {
    //       metadata,
    //       publickey: Buffer.from(initiatorPK).toString('hex'),
    //     },
    //     responderAttestation: Buffer.from(responderAttestation).toString('hex'),
    //     verifyResponder: action.verifyResponder,
    //   };
    // case types.SET_SERVER_DATA:
    //   return {
    //     ...state,
    //     server: {
    //       metadata: action.metadata,
    //       publickey: action.responderPK,
    //     },
    //     accounts: {
    //       [action.responderPK]: account(),
    //     },
    //     services: {
    //       [action.responderPK]: action.metadata,
    //     },
    //   };
    // case types.SET_FORM_DATA:
    //   const newState = { ...state };

    //   newState.accounts[
    //     '023af446a4bf68093721b83b79b6a2055a6603d2f83b554ab2dfa759b09abcbf55'
    //   ].data = action.data;
    //   return newState;

    default:
      break;
  }

  console.log('\nStore update:', result);
  return result;
};

export const StoreContext = createContext(initialValue);
