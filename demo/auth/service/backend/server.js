const websocket = require('isomorphic-ws');

const https = require('https');
const http = require('http');

const server = https.createServer({
  cert: `-----BEGIN CERTIFICATE-----
MIIBujCCAWACCQDjKdAMt3mZhDAKBggqhkjOPQQDAjBkMQswCQYDVQQGEwJJVDEQ
MA4GA1UECAwHUGVydWdpYTEQMA4GA1UEBwwHRm9saWdubzETMBEGA1UECgwKd2Vi
c29ja2V0czELMAkGA1UECwwCd3MxDzANBgNVBAMMBnNlcnZlcjAgFw0yMTA1MjYx
OTEwMjlaGA8yMTIxMDUwMjE5MTAyOVowZDELMAkGA1UEBhMCSVQxEDAOBgNVBAgM
B1BlcnVnaWExEDAOBgNVBAcMB0ZvbGlnbm8xEzARBgNVBAoMCndlYnNvY2tldHMx
CzAJBgNVBAsMAndzMQ8wDQYDVQQDDAZzZXJ2ZXIwWTATBgcqhkjOPQIBBggqhkjO
PQMBBwNCAAQKhyRhdSVOecbJU4O5XkB/iGodbnCOqmchs4TXmE3Prv5SrNDhODDv
rOWTXwR3/HrrdNfOzPdb54amu8POwpohMAoGCCqGSM49BAMCA0gAMEUCIHMRUSPl
8FGkDLl8KF1A+SbT2ds3zUOLdYvj30Z2SKSVAiEA84U/R1ly9wf5Rzv93sTHI99o
KScsr/PHN8rT2pop5pk=
-----END CERTIFICATE-----`,
  key: `-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIIjLz7YEWIrsGem2+YV8eJhHhetsjYIrjuqJLbdG7B3zoAoGCCqGSM49
AwEHoUQDQgAECockYXUlTnnGyVODuV5Af4hqHW5wjqpnIbOE15hNz67+UqzQ4Tgw
76zlk18Ed/x663TXzsz3W+eGprvDzsKaIQ==
-----END EC PRIVATE KEY-----`,
});

console.log({
  // https: server.listen(9000),
  http: http.createServer().listen(9001),
});
console.log(server instanceof https.Server);
console.log(http.createServer().listen(9011) instanceof https.Server);

const ws = new websocket.Server({ server });

console.log('Server running at ws://localhost:8099/');

ws.on('connection', (socket, request) => {
  console.log('Client connected');
  socket.send('hello, from server');

  console.log(ws);
  socket.on('message', (message) => {
    console.log(message);
    console.log('In server: ', message.toString());
  });
});
