/**
 * Web Crypto API implementation of ICryptoProvider.
 * For use in react-firebase-chat (browser environment).
 */
import {
  DEFAULT_ITERATIONS,
  DEFAULT_KEY_LENGTH,
  IV_LENGTH,
} from '../constants';
import type { EncryptionOptions } from '../types';
import type { ICryptoProvider } from './types';

const HEX_CHARS = '0123456789abcdef';

export class WebCryptoProvider implements ICryptoProvider {
  createIV(length = IV_LENGTH): string {
    const array = new Uint8Array(length / 2);
    crypto.getRandomValues(array);

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

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-CBC', length: keyLength },
      true,
      ['encrypt', 'decrypt']
    );

    const raw = await crypto.subtle.exportKey('raw', key);
    return Array.from(new Uint8Array(raw))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async encryptData(text: string, key: string): Promise<string> {
    if (!text || !key) {
      throw new Error('Text and key are required for encryption');
    }

    try {
      const iv = this.createIV();
      const ivBytes = new Uint8Array(
        (iv.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16))
      );
      const keyBytes = new Uint8Array(
        (key.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16))
      );

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-CBC' },
        false,
        ['encrypt']
      );

      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-CBC', iv: ivBytes },
        cryptoKey,
        new TextEncoder().encode(text)
      );

      const cipherBase64 = btoa(
        String.fromCharCode(...new Uint8Array(encrypted))
      );
      return iv + cipherBase64;
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
      const encryptedBase64 = cipher.substring(IV_LENGTH);

      const ivBytes = new Uint8Array(
        (iv.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16))
      );
      const encryptedBytes = Uint8Array.from(atob(encryptedBase64), (c) =>
        c.charCodeAt(0)
      );
      const keyBytes = new Uint8Array(
        (key.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16))
      );

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-CBC' },
        false,
        ['decrypt']
      );

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-CBC', iv: ivBytes },
        cryptoKey,
        encryptedBytes
      );

      return new TextDecoder().decode(decrypted);
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
