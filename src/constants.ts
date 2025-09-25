// constants.ts

import { generateRandomUUID } from './utilities';

export const DEFAULT_SALT: string = generateRandomUUID(); // Generate a unique salt
export const DEFAULT_ITERATIONS: number = 10000; // Increased for better security
export const DEFAULT_KEY_LENGTH: number = 256;
export const DEFAULT_CLEAR_SEND_NOTIFICATION: number = 3000;
export const DEFAULT_TYPING_TIMEOUT_SECONDS = 3000;
