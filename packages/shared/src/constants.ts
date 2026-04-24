// PBKDF2 key derivation — must match between web and RN providers
export const DEFAULT_ITERATIONS = 10000;
export const DEFAULT_KEY_LENGTH = 256;

// IV is 16 bytes = 32 hex characters (AES-256-CBC)
export const IV_LENGTH = 32;

// UI timing
export const DEFAULT_CLEAR_SEND_NOTIFICATION = 3000; // ms
export const DEFAULT_TYPING_TIMEOUT_MS = 3000; // ms
export const TYPING_EXPIRY_MS = 7000; // ms — treat typing as stale after this long
