import { ES256KSigner, EdDSASigner } from 'did-jwt'

export const signers = {
  ES256K: ES256KSigner,
  EdDSA: EdDSASigner
}
