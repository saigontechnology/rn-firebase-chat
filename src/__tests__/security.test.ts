import {
  sanitizeUserInput,
  validateFilePath,
  validateEncryptionKey,
  validateMessage,
  validateUserId,
  RateLimiter,
} from '../utilities/security';

describe('Security Utilities', () => {
  describe('sanitizeUserInput', () => {
    it('should remove script tags', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello World';
      const sanitized = sanitizeUserInput(maliciousInput);
      expect(sanitized).toBe('Hello World');
    });

    it('should remove javascript: protocols', () => {
      const maliciousInput = 'javascript:alert("xss")';
      const sanitized = sanitizeUserInput(maliciousInput);
      expect(sanitized).toBe('alert("xss")');
    });

    it('should handle non-string inputs', () => {
      expect(sanitizeUserInput(123 as any)).toBe('');
      expect(sanitizeUserInput(null as any)).toBe('');
      expect(sanitizeUserInput(undefined as any)).toBe('');
    });

    it('should preserve safe content', () => {
      const safeInput = 'Hello, this is a safe message!';
      const sanitized = sanitizeUserInput(safeInput);
      expect(sanitized).toBe(safeInput);
    });
  });

  describe('validateFilePath', () => {
    it('should reject directory traversal attempts', () => {
      expect(validateFilePath('../etc/passwd')).toBe(false);
      expect(validateFilePath('../../system')).toBe(false);
      expect(validateFilePath('/etc/shadow')).toBe(false);
      expect(validateFilePath('C:\\Windows\\System32')).toBe(false);
    });

    it('should accept safe file paths', () => {
      expect(validateFilePath('images/avatar.jpg')).toBe(true);
      expect(validateFilePath('documents/file.pdf')).toBe(true);
      expect(validateFilePath('user_uploads/photo.png')).toBe(true);
    });

    it('should handle invalid inputs', () => {
      expect(validateFilePath('')).toBe(false);
      expect(validateFilePath(null as any)).toBe(false);
      expect(validateFilePath(123 as any)).toBe(false);
    });
  });

  describe('validateEncryptionKey', () => {
    it('should validate strong keys', () => {
      const result = validateEncryptionKey('StrongKey123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak keys', () => {
      const result = validateEncryptionKey('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Encryption key must be at least 8 characters long');
    });

    it('should require numbers and letters', () => {
      const noNumbers = validateEncryptionKey('onlyletters');
      expect(noNumbers.isValid).toBe(false);
      expect(noNumbers.errors).toContain('Encryption key should contain at least one number');

      const noLetters = validateEncryptionKey('12345678');
      expect(noLetters.isValid).toBe(false);
      expect(noLetters.errors).toContain('Encryption key should contain at least one letter');
    });

    it('should handle invalid inputs', () => {
      const result = validateEncryptionKey('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Encryption key must be a non-empty string');
    });
  });

  describe('validateMessage', () => {
    it('should validate normal messages', () => {
      const result = validateMessage('Hello, World!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty messages', () => {
      const result = validateMessage('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message cannot be empty');
    });

    it('should reject very long messages', () => {
      const longMessage = 'a'.repeat(10001);
      const result = validateMessage(longMessage);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message is too long (max 10000 characters)');
    });

    it('should handle non-string inputs', () => {
      const result = validateMessage(123 as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message must be a string');
    });
  });

  describe('validateUserId', () => {
    it('should validate good user IDs', () => {
      expect(validateUserId('user123')).toBe(true);
      expect(validateUserId('test-user_456')).toBe(true);
      expect(validateUserId('ABC123XYZ')).toBe(true);
    });

    it('should reject invalid user IDs', () => {
      expect(validateUserId('')).toBe(false);
      expect(validateUserId('ab')).toBe(false); // too short
      expect(validateUserId('a'.repeat(51))).toBe(false); // too long
      expect(validateUserId('user@domain.com')).toBe(false); // invalid characters
      expect(validateUserId('user name')).toBe(false); // spaces not allowed
    });

    it('should handle non-string inputs', () => {
      expect(validateUserId(123 as any)).toBe(false);
      expect(validateUserId(null as any)).toBe(false);
    });
  });

  describe('RateLimiter', () => {
    it('should allow requests within limits', () => {
      const rateLimiter = new RateLimiter(5, 1000);

      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.isAllowed('user1')).toBe(true);
      }
    });

    it('should block requests exceeding limits', () => {
      const rateLimiter = new RateLimiter(3, 1000);

      // First 3 should be allowed
      for (let i = 0; i < 3; i++) {
        expect(rateLimiter.isAllowed('user1')).toBe(true);
      }

      // 4th should be blocked
      expect(rateLimiter.isAllowed('user1')).toBe(false);
    });

    it('should handle different users separately', () => {
      const rateLimiter = new RateLimiter(2, 1000);

      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user2')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user2')).toBe(true);

      // Both users should now be at their limit
      expect(rateLimiter.isAllowed('user1')).toBe(false);
      expect(rateLimiter.isAllowed('user2')).toBe(false);
    });

    it('should reset user limits', () => {
      const rateLimiter = new RateLimiter(1, 1000);

      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(false);

      rateLimiter.reset('user1');
      expect(rateLimiter.isAllowed('user1')).toBe(true);
    });
  });
});
