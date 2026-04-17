export interface EncryptionOptions {
  salt: string;
  iterations?: number;
  keyLength?: number;
}

export interface EncryptionFunctions {
  encryptFunctionProp: (text: string) => Promise<string>;
  decryptFunctionProp: (text: string) => Promise<string>;
  generateKeyFunctionProp: (key: string) => Promise<string>;
}

export interface EncryptionStatus {
  isEnabled: boolean;
  isReady: boolean;
  keyGenerated: boolean;
  lastTestedAt?: Date;
  testPassed?: boolean;
}
