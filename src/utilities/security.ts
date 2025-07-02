/**
 * Security utilities for the Firebase chat library
 */

/**
 * Validates user input to prevent XSS and injection attacks
 */
export const sanitizeUserInput = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove potentially dangerous characters and scripts
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

/**
 * Validates file paths to prevent directory traversal
 */
export const validateFilePath = (filePath: string): boolean => {
  if (typeof filePath !== 'string' || filePath.length === 0) {
    return false;
  }

  // Check for directory traversal patterns
  const dangerousPatterns = [
    '../',
    '..\\',
    '/etc/',
    '/system/',
    'c:\\',
    '%2e%2e',
    '%252e%252e',
  ];

  const normalizedPath = filePath.toLowerCase();
  return !dangerousPatterns.some(pattern => normalizedPath.includes(pattern));
};

/**
 * Validates encryption key strength
 */
export const validateEncryptionKey = (key: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!key || typeof key !== 'string') {
    errors.push('Encryption key must be a non-empty string');
  }

  if (key.length < 8) {
    errors.push('Encryption key must be at least 8 characters long');
  }

  if (key.length > 256) {
    errors.push('Encryption key must not exceed 256 characters');
  }

  // Check for complexity (at least one number, one letter)
  if (!/\d/.test(key)) {
    errors.push('Encryption key should contain at least one number');
  }

  if (!/[a-zA-Z]/.test(key)) {
    errors.push('Encryption key should contain at least one letter');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates message content
 */
export const validateMessage = (message: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (typeof message !== 'string') {
    errors.push('Message must be a string');
  }

  if (message.length === 0) {
    errors.push('Message cannot be empty');
  }

  if (message.length > 10000) {
    errors.push('Message is too long (max 10000 characters)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates user ID format
 */
export const validateUserId = (userId: string): boolean => {
  if (typeof userId !== 'string' || userId.length === 0) {
    return false;
  }

  // Check for valid UUID or alphanumeric format
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  return validPattern.test(userId) && userId.length >= 3 && userId.length <= 50;
};

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 10, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];

    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs);

    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }

    // Add current attempt
    validAttempts.push(now);
    this.attempts.set(identifier, validAttempts);

    return true;
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}
