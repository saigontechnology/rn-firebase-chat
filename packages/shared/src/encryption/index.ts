export * from './types';
export { WebCryptoProvider } from './webProvider';
// RNAesCryptoProvider is exported separately to avoid bundling the native module
// in web builds. Import it explicitly when needed:
//   import { RNAesCryptoProvider } from '@saigontechnology/firebase-chat-shared/src/encryption/rnProvider';
