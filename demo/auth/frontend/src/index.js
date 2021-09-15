// Ignore this file, it is for presentation only,
// check ./client.js, ./server.js, and ./wallet.js
import * as client from './client';
import * as wallet from './wallet';
import * as SlashtagsURL from '@synonymdev/slashtags-url';
import QRCode from 'qrcode';

const walletDiv = document.getElementById('wallet');
const clientDiv = document.getElementById('client');

const setQR = (slashtagsAction) => {
  const btn = document.createElement('button');
  btn.classList.add('go-to-wallet');

  const canvas = document.createElement('canvas');
  canvas.classList.add('btn');

  QRCode.toCanvas(canvas, slashtagsAction, function (error) {
    if (error) console.error(error);
    console.log('success!');
  });

  btn.innerHTML += `<pre>${slashtagsAction}</pre>`;

  canvas.onclick = () => handleWallet({ slashtagsAction });
  btn.onclick = () => handleWallet({ slashtagsAction });

  const back = document.createElement('button');
  back.classList.add('btn', 'signin');
  back.innerHTML = '< back';
  back.onclick = loggedOut;

  clientDiv.innerHTML = '';
  clientDiv?.appendChild(canvas);
  clientDiv?.appendChild(btn);
  clientDiv?.appendChild(back);
};

const loggedOut = () => {
  localStorage.removeItem('token');
  clientDiv.innerHTML = '';
  const btn1 = document.createElement('button');
  btn1.classList.add('btn', 'signin');
  const btn2 = document.createElement('button');
  btn2.classList.add('btn', 'signin');
  const btn3 = document.createElement('button');
  btn3.classList.add('btn', 'signin');

  btn1.innerHTML = 'Sign in (existing user)';
  btn2.innerHTML = 'Sign in (new user)';
  btn3.innerHTML = 'Sign in (blocked user)';

  btn1.onclick = () => {
    console.log('Client request to login');
    wallet.setUser('Rip Hal!');
    client.sendInitialRequest(handleAuthed, setQR);
  };

  btn2.onclick = () => {
    console.log('Client request to login');
    wallet.setUser('new user');
    client.sendInitialRequest(handleAuthed, setQR);
  };

  btn3.onclick = () => {
    console.log('Client request to login');
    wallet.setUser('blocked user');
    client.sendInitialRequest(handleAuthed, setQR);
  };

  clientDiv.appendChild(btn1);
  clientDiv.appendChild(btn2);
  clientDiv.appendChild(btn3);
};

const verifyServerResponse = async (info) => {
  info = await info;
  console.log('Verified server response: ', {
    ...info,
  });

  walletDiv.innerHTML = `
  <p>Successfully Authenticated your identity</p>
  <br/>
  <b>With server:</b><p>${info.publickey}</p>
  <br/>
  <b>Metdata:</b><p>${JSON.stringify(info.metadata)}</p>
  `;
};

const handleWallet = (attestConfig) => {
  console.log('=====================================');
  console.log('=========== Wallet side =============');
  console.log('=====================================');
  const publicKey = wallet.getPublicKey();
  console.log('User public key:', publicKey);
  console.log('Passing slashtagsAction', attestConfig.slashtagsAction);

  const { payload } = SlashtagsURL.parse(attestConfig.slashtagsAction);
  const { challenge, cbURL, remotePK } = payload;

  walletDiv.innerHTML = `
  <p><b>Server</b>: ${remotePK}</p>
  <br/>
  <p>wants to auttenticate you with Slashtag id</p>
  <br/>
  <p>From slashtagsAction:</p>
  <pre>${attestConfig.slashtagsAction}</pre>
  <p>Sign their challenge:</p>
  <pre>${challenge}</pre>
  <p>and callback url:</p>
  <pre>${cbURL}</pre>
  `;

  const btn = document.createElement('button');
  btn.innerHTML = 'Sign in';
  btn.onclick = () => {
    verifyServerResponse(wallet.attest(attestConfig));
  };
  btn.classList.add('btn', 'signin');

  walletDiv.appendChild(btn);
};

const handleAuthed = (token) => {
  if (token.type === 'Begone!') {
    clientDiv.innerHTML = `
    <p>YOU ARE BLOCKED</p>
    <br/>
    <p>Begone!</p>
    <p>${token.token.publicKey}</p>
    <br/>
    `;
  } else {
    localStorage.setItem('token', JSON.stringify(token));

    clientDiv.innerHTML = `
    <p>Welcome <b>${token.user ? token.user : 'nameless person yet'}</b></p>
    <br/>
    <p>you are signed in with public key: </p>
    <p>${token.publicKey}</p>
    <br/>
    `;
  }

  const btn = document.createElement('button');
  btn.innerHTML = 'Sign out';
  btn.classList.add('btn', 'signin');

  btn.onclick = loggedOut;
  clientDiv.appendChild(btn);
};

const main = async () => {
  console.log('=====================================');
  console.log('=========== Client side =============');
  console.log('=====================================');
  console.log('Fetching homepage from server');

  let token = localStorage.getItem('token');

  let home = await fetch(
    'http://localhost:9090/home/' +
      (typeof token === 'string' ? '?token=' + token : ''),
  );

  if (home.ok) {
    token = JSON.parse(token);
    handleAuthed(token);
  } else if (home.status === 401) {
    console.log('401 needs Auth');

    loggedOut();
  } else {
    console.log('Unexpeceted error:', home);
  }
};

main();
