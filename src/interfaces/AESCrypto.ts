export interface EncryptionOptions {
  salt?: string;
  iterations?: number;
  keyLength?: number;
}

export interface EncryptionFunctions {
  encryptFunctionProp: (text: string) => Promise<string>;
  decryptFunctionProp: (key: string) => Promise<string>;
  generateKeyFunctionProp: () => Promise<string>;
}
