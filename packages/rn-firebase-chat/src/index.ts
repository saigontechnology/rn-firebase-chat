import Aes from 'react-native-aes-crypto';
import { FirestoreServices } from './services/firebase/firestore';
import { createRNFirestoreClient } from './services/firebase/rn-adapter';
import { RNAesCryptoProvider } from '@saigontechnology/firebase-chat-shared/rnProvider';

// Auto-register RN platform adapters so consumers don't have to wire them.
FirestoreServices.getInstance().setFirestoreClient(createRNFirestoreClient());
FirestoreServices.getInstance().setCryptoProvider(new RNAesCryptoProvider(Aes));

export * from './services/firebase';
export * from './chat';
export * from './hooks';
export * from './reducer/action';
export * from './interfaces/message';
export * from './interfaces/conversation';
export * from './interfaces/storage';
