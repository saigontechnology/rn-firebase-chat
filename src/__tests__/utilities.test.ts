import { generateBadWordsRegex, filterBadWords, getTextMessage } from '../utilities/blacklist';
import { formatDate, timeFromNow, getCurrentTimestamp } from '../utilities/date';

// Mock required modules
jest.mock('@react-native-firebase/firestore', () => ({
  Timestamp: {
    now: () => ({
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: (Date.now() % 1000) * 1000000,
    }),
  },
}));

jest.mock('dayjs', () => {
  const dayjs = jest.requireActual('dayjs');
  return dayjs;
});

// Mock AES crypto since it requires React Native
jest.mock('../utilities/aesCrypto', () => ({
  encryptData: jest.fn(async (text: string) => `encrypted_${text}`),
  decryptData: jest.fn(async (encrypted: string) => encrypted.replace('encrypted_', '')),
  generateEncryptionKey: jest.fn(async (password: string) => `key_${password}`),
}));

const { encryptData, decryptData, generateEncryptionKey } = require('../utilities/aesCrypto');

describe('Utility Functions', () => {
  describe('AES Crypto (Mocked)', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const testData = 'Hello, World!';
      const key = await generateEncryptionKey('test-password');

      const encrypted = await encryptData(testData, key);
      expect(encrypted).toBe(`encrypted_${testData}`);

      const decrypted = await decryptData(encrypted, key);
      expect(decrypted).toBe(testData);
    });
  });

  describe('Blacklist Filter', () => {
    it('should filter blacklisted words', () => {
      const blacklist = ['bad', 'evil'];
      const regex = generateBadWordsRegex(blacklist);
      const text = 'This is a bad example with evil words';

      const filtered = filterBadWords(text, regex);
      expect(filtered).toBe('This is a *** example with **** words');
    });

    it('should handle case insensitive filtering', () => {
      const blacklist = ['BAD'];
      const regex = generateBadWordsRegex(blacklist);
      const text = 'This is bad and Bad and BAD';

      const filtered = filterBadWords(text, regex);
      expect(filtered).toBe('This is *** and *** and ***');
    });

    it('should handle empty blacklist through getTextMessage', () => {
      const text = 'This is a normal message';
      const filtered = getTextMessage(undefined, text);
      expect(filtered).toBe(text);
    });

    it('should generate regex from word list', () => {
      const words = ['test', 'demo'];
      const regex = generateBadWordsRegex(words);
      expect(regex).toBeInstanceOf(RegExp);

      // Reset regex state before each test
      expect(regex.test('test')).toBe(true);

      // Create new regex instance to avoid state issues
      const regex2 = generateBadWordsRegex(words);
      expect(regex2.test('demo')).toBe(true);

      const regex3 = generateBadWordsRegex(words);
      expect(regex3.test('clean')).toBe(false);
    });
  });

  describe('Date Utilities', () => {
    it('should get current timestamp', () => {
      const timestamp = getCurrentTimestamp();
      expect(typeof timestamp).toBe('number');
      expect(timestamp).toBeGreaterThan(0);
    });

    it('should format dates correctly', () => {
      const date = new Date('2023-12-25T10:30:00');
      const formatted = formatDate(date);
      expect(formatted).toBeDefined();
    });

    it('should calculate time from now', () => {
      const pastDate = new Date(Date.now() - 60000); // 1 minute ago
      const relative = timeFromNow(pastDate);
      expect(relative).toContain('minute');
    });
  });
});
