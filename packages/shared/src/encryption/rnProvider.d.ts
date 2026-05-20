import type { EncryptionOptions } from '../types';
import type { ICryptoProvider } from './types';
export declare class RNAesCryptoProvider implements ICryptoProvider {
    private Aes;
    constructor(aes: any);
    createIV(length?: number): string;
    generateEncryptionKey(password: string, options: EncryptionOptions): Promise<string>;
    encryptData(text: string, key: string): Promise<string>;
    decryptData(cipher: string, key: string): Promise<string>;
    decryptedMessageData(text: string, key: string): Promise<string>;
}
