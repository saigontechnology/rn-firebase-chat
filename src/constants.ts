// constants.ts
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export const DEFAULT_SALT: string = uuidv4(); // Generate a unique salt
export const DEFAULT_ITERATIONS: number = 10000; // Increased for better security
export const DEFAULT_KEY_LENGTH: number = 256;
export const DEFAULT_CLEAR_SEND_NOTIFICATION: number = 3000;
export const DEFAULT_TYPING_TIMEOUT_SECONDS = 3000;
