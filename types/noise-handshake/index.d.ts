declare module 'noise-handshake' {
  class Noise {
    constructor(...args);
    initialise: (prologue: Buffer, remoteStatic?: Buffer) => void;
    recv: (buf: Buffer) => Buffer;
    send: (payload: Buffer) => Buffer;
    rs: Buffer;
  }

  export = Noise;
}
