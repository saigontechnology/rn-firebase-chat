export interface EncryptionOptions {
  salt?: string;
  iterations?: number;
  keyLength?: number;
}

export interface EncryptionFunctions {
  encryptFunctionProp: (text: string) => Promise<string>;
  decryptFunctionProp: (text: string) => Promise<string>; // Fixed: should be text, not key
  generateKeyFunctionProp: (key: string) => Promise<string>; // Fixed: should accept key parameter
}

export interface EncryptionStatus {
  isEnabled: boolean;
  isReady: boolean;
  keyGenerated: boolean;
  lastTestedAt?: Date;
  testPassed?: boolean;
}
