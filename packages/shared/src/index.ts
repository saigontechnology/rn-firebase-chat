// Types
export * from './types';

// Constants
export * from './constants';

// Utilities
export * from './utils';

// Reducer (pure — no platform deps)
export * from './reducer';

// Hooks (requires React peer dep)
export * from './hooks';

// Encryption interface + web provider
// RN provider must be imported directly to avoid bundling native modules in web:
//   import { RNAesCryptoProvider } from '@saigontechnology/firebase-chat-shared/src/encryption/rnProvider';
export * from './encryption';

// Service interfaces
export * from './services';

// UI hooks (platform-agnostic business logic for screens)
export * from './ui';
