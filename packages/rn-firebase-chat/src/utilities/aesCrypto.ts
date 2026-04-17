import Aes from 'react-native-aes-crypto';
import { RNAesCryptoProvider } from '@saigontechnology/firebase-chat-shared/rnProvider';
import type { EncryptionOptions } from '../interfaces';

const provider = new RNAesCryptoProvider(Aes);

export const createIV = (length?: number): string => provider.createIV(length);

export const encryptData = (text: string, key: string): Promise<string> =>
  provider.encryptData(text, key);

export const decryptData = (cipher: string, key: string): Promise<string> =>
  provider.decryptData(cipher, key);

export const decryptedMessageData = (
  text: string,
  key: string
): Promise<string> => provider.decryptedMessageData(text, key);

export const generateEncryptionKey = (
  password: string,
  options: EncryptionOptions
): Promise<string> => provider.generateEncryptionKey(password, options);

/** Low-level PBKDF2 key derivation — use generateEncryptionKey instead. */
export const generateKey = (
  password: string,
  salt: string,
  cost: number,
  length: number
): Promise<string> => Aes.pbkdf2(password, salt, cost, length, 'sha256');
