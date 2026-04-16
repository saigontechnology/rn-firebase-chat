import type { EncryptionOptions } from '../types';
export interface ICryptoProvider {
    generateEncryptionKey(password: string, options: EncryptionOptions): Promise<string>;
    encryptData(text: string, key: string): Promise<string>;
    decryptData(cipher: string, key: string): Promise<string>;
    createIV(): string;
    decryptedMessageData(text: string, key: string): Promise<string>;
}
