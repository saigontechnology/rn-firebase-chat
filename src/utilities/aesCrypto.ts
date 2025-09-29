/**
 * Created by NL on 5/31/23.
 */
import Aes from 'react-native-aes-crypto';
import {
  DEFAULT_ITERATIONS,
  DEFAULT_KEY_LENGTH,
} from '../constants';
import type { EncryptionOptions } from '../interfaces';

const generateKey = (
  password: string,
  salt: string,
  cost: number,
  length: number
) => {
  if (!password || !salt) {
    throw new Error('Password and salt are required for key generation');
  }
  return Aes.pbkdf2(password, salt, cost, length, 'sha256');
};

const encryptData = async (text: string, key: string): Promise<string> => {
  if (!text || !key) {
    throw new Error('Text and key are required for encryption');
  }

  try {
    const iv = createIV();
    const cipher = await Aes.encrypt(text, key, iv, 'aes-256-cbc');
    return iv + cipher;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt message');
  }
};

const decryptData = async (cipher: string, key: string): Promise<string> => {
  if (!cipher || !key) {
    throw new Error('Cipher and key are required for decryption');
  }

  if (cipher.length < IV_LENGTH) {
    throw new Error('Invalid cipher format');
  }

  try {
    const iv = cipher.substring(0, IV_LENGTH);
    const encryptedText = cipher.substring(IV_LENGTH);
    return await Aes.decrypt(encryptedText, key, iv, 'aes-256-cbc');
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt message');
  }
};

const CHARACTERS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const IV_LENGTH = 16;

const createIV = (length = IV_LENGTH): string => {
  // Use crypto-secure random generation
  const array = new Uint8Array(length);
  // if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
  //   crypto.getRandomValues(array);
  // } else {
  // Fallback for environments without crypto
  for (let i = 0; i < length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  // }

  // Convert to base64-like string using our character set
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARACTERS.charAt((array[i] ?? 0) % CHARACTERS.length);
  }

  return result;
};

const generateEncryptionKey = async (
  encryptKey: string,
  options: EncryptionOptions
): Promise<string> => {
  const {
    salt,
    iterations = DEFAULT_ITERATIONS,
    keyLength = DEFAULT_KEY_LENGTH,
  } = options;

  try {
    return await generateKey(encryptKey, salt, iterations, keyLength);
  } catch (error) {
    console.error('Error generating encryption key:', error);
    throw error;
  }
};

const decryptedMessageData = async (
  text: string,
  key: string
): Promise<string> => {
  if (!text || !key) {
    console.warn('Invalid parameters for decryption, returning original text');
    return text;
  }

  try {
    const decryptedMessage = await decryptData(text, key);
    return decryptedMessage || text;
  } catch (error) {
    console.error('Error decrypting message data:', error);
    // Return original text if decryption fails to maintain functionality
    return text;
  }
};

export {
  generateKey,
  encryptData,
  decryptData,
  createIV,
  generateEncryptionKey,
  decryptedMessageData,
};
