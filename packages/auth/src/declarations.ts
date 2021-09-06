declare module 'noise-handshake' {}
declare module 'noise-curve-secp' {}
declare module 'sodium-universal' {
  import * as sodium from 'sodium-native';
  export = sodium;
}
