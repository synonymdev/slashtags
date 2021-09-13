declare module 'noise-curve-secp' {
  function generateKeyPair(): {
    publicKey: Buffer;
    secretKey: Buffer;
  };

  export = { generateKeyPair };
}
