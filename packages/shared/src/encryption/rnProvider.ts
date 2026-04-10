/**
 * react-native-aes-crypto implementation of ICryptoProvider.
 * For use in rn-firebase-chat (React Native environment).
 *
 * Requires peer dependency: react-native-aes-crypto
 */
import { DEFAULT_ITERATIONS, DEFAULT_KEY_LENGTH, IV_LENGTH } from '../constants';
import type { EncryptionOptions } from '../types';
import type { ICryptoProvider } from './types';

const HEX_CHARS = '0123456789abcdef';

export class RNAesCryptoProvider implements ICryptoProvider {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private Aes: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(aes: any) {
    this.Aes = aes;
  }
  createIV(length = IV_LENGTH): string {
    const array = new Uint8Array(length / 2);
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    let result = '';
    for (let i = 0; i < array.length; i++) {
      const byte = array[i] ?? 0;
      result += HEX_CHARS.charAt(byte >> 4);
      result += HEX_CHARS.charAt(byte & 0x0f);
    }
    return result;
  }

  async generateEncryptionKey(
    password: string,
    options: EncryptionOptions
  ): Promise<string> {
    const {
      salt,
      iterations = DEFAULT_ITERATIONS,
      keyLength = DEFAULT_KEY_LENGTH,
    } = options;

    if (!password || !salt) {
      throw new Error('Password and salt are required for key generation');
    }

    try {
      return await this.Aes.pbkdf2(password, salt, iterations, keyLength, 'sha256');
    } catch (error) {
      console.error('Error generating encryption key:', error);
      throw error;
    }
  }

  async encryptData(text: string, key: string): Promise<string> {
    if (!text || !key) {
      throw new Error('Text and key are required for encryption');
    }

    try {
      const iv = this.createIV();
      const cipher = await this.Aes.encrypt(text, key, iv, 'aes-256-cbc');
      return iv + cipher;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  async decryptData(cipher: string, key: string): Promise<string> {
    if (!cipher || !key) {
      throw new Error('Cipher and key are required for decryption');
    }

    if (cipher.length < IV_LENGTH) {
      throw new Error('Invalid cipher format');
    }

    try {
      const iv = cipher.substring(0, IV_LENGTH);
      const encryptedText = cipher.substring(IV_LENGTH);
      return await this.Aes.decrypt(encryptedText, key, iv, 'aes-256-cbc');
    } catch {
      throw new Error('Failed to decrypt message');
    }
  }

  async decryptedMessageData(text: string, key: string): Promise<string> {
    if (!text || !key) return text;
    if (text.length <= IV_LENGTH) return text;

    try {
      const decrypted = await this.decryptData(text, key);
      return decrypted || text;
    } catch {
      return text;
    }
  }
}
