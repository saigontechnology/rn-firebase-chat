/**
 * Created by NL on 5/31/23.
 */
import Aes from 'react-native-aes-crypto';
import {
  DEFAULT_ITERATIONS,
  DEFAULT_KEY_LENGTH,
  DEFAULT_SALT,
} from '../constants';
import type { EncryptionOptions } from '../interfaces';

const generateKey = (
  password: string,
  salt: string,
  cost: number,
  length: number
) => Aes.pbkdf2(password, salt, cost, length);

const encryptData = (text: string, key: string) => {
  const iv = createIV();
  return Aes.encrypt(text, key, iv, 'aes-256-cbc').then(
    (cipher) => iv + cipher
  );
};

const decryptData = (cipher: string, key: string) => {
  const iv = cipher.substring(0, 16);
  const encryptedText = cipher.substring(16, cipher.length);
  return Aes.decrypt(encryptedText, key, iv, 'aes-256-cbc');
};

const CHARACTERS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const IV_LENGTH = 16;

const createIV = (length = IV_LENGTH) => {
  let result = '';
  const charactersLength = CHARACTERS.length;
  for (let i = 0; i < length; i++) {
    result += CHARACTERS.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

const generateEncryptionKey = async (
  conversationId: string,
  options: EncryptionOptions = {}
): Promise<string> => {
  const {
    salt = DEFAULT_SALT,
    iterations = DEFAULT_ITERATIONS,
    keyLength = DEFAULT_KEY_LENGTH,
  } = options;

  try {
    const key = await generateKey(conversationId, salt, iterations, keyLength);
    return key;
  } catch (error) {
    console.error('Error generating encryption key:', error);
    throw error;
  }
};

const encryptedMessageData = async (
  text: string,
  conversationId: string,
  options: EncryptionOptions = {}
) => {
  const {
    salt = DEFAULT_SALT,
    iterations = DEFAULT_ITERATIONS,
    keyLength = DEFAULT_KEY_LENGTH,
  } = options;
  try {
    const key = await generateKey(conversationId, salt, iterations, keyLength);
    try {
      const decryptedMessage = await decryptData(text, key);
      return decryptedMessage || text;
    } catch {
      return text;
    }
  } catch {
    return text;
  }
};

export {
  generateKey,
  encryptData,
  decryptData,
  createIV,
  generateEncryptionKey,
  encryptedMessageData,
};
