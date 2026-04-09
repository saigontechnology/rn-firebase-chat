/**
 * Created by NL on 5/31/23.
 */
import Aes from 'react-native-aes-crypto';
import { DEFAULT_ITERATIONS, DEFAULT_KEY_LENGTH } from '../constants';
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
  } catch {
    throw new Error('Failed to decrypt message');
  }
};

const HEX_CHARS = '0123456789abcdef';
// IV is 16 bytes = 32 hex characters
const IV_LENGTH = 32;

const createIV = (length = IV_LENGTH): string => {
  const array = new Uint8Array(length / 2);
  for (let i = 0; i < array.length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }

  // Convert bytes to hex string
  let result = '';
  for (let i = 0; i < array.length; i++) {
    const byte = array[i] ?? 0;
    result += HEX_CHARS.charAt(byte >> 4);
    result += HEX_CHARS.charAt(byte & 0x0f);
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
    return text;
  }

  // Text shorter than IV_LENGTH cannot be an encrypted message — skip decryption
  if (text.length <= IV_LENGTH) {
    return text;
  }

  try {
    const decryptedMessage = await decryptData(text, key);
    return decryptedMessage || text;
  } catch {
    // Return original text if decryption fails (e.g. plain-text messages stored before encryption was enabled)
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
