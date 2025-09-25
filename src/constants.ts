// constants.ts

const cryptoRandomUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
    /[xy]/g,
    (c: string) => {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }
  );
};

export const DEFAULT_SALT: string = cryptoRandomUUID(); // Generate a unique salt
export const DEFAULT_ITERATIONS: number = 10000; // Increased for better security
export const DEFAULT_KEY_LENGTH: number = 256;
export const DEFAULT_CLEAR_SEND_NOTIFICATION: number = 3000;
export const DEFAULT_TYPING_TIMEOUT_SECONDS = 3000;
