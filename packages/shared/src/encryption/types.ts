import type { EncryptionOptions } from '../types';

/**
 * Platform-agnostic encryption contract.
 * Implemented by webProvider (Web Crypto API) and rnProvider (react-native-aes-crypto).
 */
export interface ICryptoProvider {
  /**
   * Derives a hex-encoded AES-256 key from password + salt via PBKDF2/SHA-256.
   */
  generateEncryptionKey(
    password: string,
    options: EncryptionOptions
  ): Promise<string>;

  /**
   * Encrypts `text` with AES-256-CBC. Returns hex IV prepended to base64 ciphertext.
   */
  encryptData(text: string, key: string): Promise<string>;

  /**
   * Decrypts a value produced by `encryptData`. Throws on failure.
   */
  decryptData(cipher: string, key: string): Promise<string>;

  /**
   * Generates a random hex IV (32 hex chars = 16 bytes).
   */
  createIV(): string;

  /**
   * Safe decrypt with fallback — returns original text if decryption fails
   * (handles plain-text messages stored before encryption was enabled).
   */
  decryptedMessageData(text: string, key: string): Promise<string>;
}
