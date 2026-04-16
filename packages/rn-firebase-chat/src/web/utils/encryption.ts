import {
  WebCryptoProvider,
  type EncryptionOptions,
} from '@saigontechnology/firebase-chat-shared';

const provider = new WebCryptoProvider();

export { WebCryptoProvider };

export const createIV = (length?: number): string => provider.createIV(length);

export const encryptData = (text: string, key: string): Promise<string> =>
  provider.encryptData(text, key);

export const decryptData = (cipher: string, key: string): Promise<string> =>
  provider.decryptData(cipher, key);

/** Low-level key derivation: accepts individual PBKDF2 parameters. */
export const generateKey = (
  password: string,
  salt: string,
  cost: number,
  length: number
): Promise<string> =>
  provider.generateEncryptionKey(password, { salt, iterations: cost, keyLength: length });

/** High-level key generation matching rn-firebase-chat's generateEncryptionKey. */
export const generateEncryptionKey = (
  encryptKey: string,
  options: EncryptionOptions
): Promise<string> => provider.generateEncryptionKey(encryptKey, options);

/** Safe decrypt with plaintext fallback — handles mixed encrypted/plaintext history. */
export const decryptedMessageData = (text: string, key: string): Promise<string> =>
  provider.decryptedMessageData(text, key);
