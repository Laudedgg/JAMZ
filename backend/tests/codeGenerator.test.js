import { describe, it, expect } from 'vitest';
import {
  generateUniqueCode,
  validateCodeFormat,
  isCodeInText,
  extractCodesFromText
} from '../utils/codeGenerator.js';

describe('Code Generator Utility', () => {
  describe('generateUniqueCode', () => {
    it('should generate a code with correct format', () => {
      const code = generateUniqueCode();
      expect(code).toMatch(/^JAMZ\d{4}[A-Z0-9]{4}$/);
    });

    it('should generate codes starting with JAMZ', () => {
      const code = generateUniqueCode();
      expect(code.startsWith('JAMZ')).toBe(true);
    });

    it('should generate different codes on multiple calls', () => {
      const code1 = generateUniqueCode();
      const code2 = generateUniqueCode();
      const code3 = generateUniqueCode();
      
      // While theoretically possible to get duplicates, extremely unlikely
      const codes = [code1, code2, code3];
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBeGreaterThan(1);
    });

    it('should have correct length (12 characters)', () => {
      const code = generateUniqueCode();
      expect(code.length).toBe(12);
    });
  });

  describe('validateCodeFormat', () => {
    it('should validate correct code format', () => {
      expect(validateCodeFormat('JAMZ1724AB12')).toBe(true);
      expect(validateCodeFormat('JAMZ0000ZZZZ')).toBe(true);
      expect(validateCodeFormat('JAMZ9999AAAA')).toBe(true);
    });

    it('should reject codes without JAMZ prefix', () => {
      expect(validateCodeFormat('JAMB1724AB12')).toBe(false);
      expect(validateCodeFormat('1724AB12')).toBe(false);
    });

    it('should reject codes with incorrect length', () => {
      expect(validateCodeFormat('JAMZ1724AB')).toBe(false);
      expect(validateCodeFormat('JAMZ1724AB123')).toBe(false);
    });

    it('should reject codes with invalid characters', () => {
      expect(validateCodeFormat('JAMZ1724ab12')).toBe(false); // lowercase
      expect(validateCodeFormat('JAMZ172@AB12')).toBe(false); // special char
      expect(validateCodeFormat('JAMZ17a4AB12')).toBe(false); // letter in digit section
    });

    it('should reject empty or null codes', () => {
      expect(validateCodeFormat('')).toBe(false);
      expect(validateCodeFormat(null)).toBe(false);
      expect(validateCodeFormat(undefined)).toBe(false);
    });
  });

  describe('isCodeInText', () => {
    it('should find code in text', () => {
      expect(isCodeInText('JAMZ1724AB12', 'Check out my post with code JAMZ1724AB12')).toBe(true);
    });

    it('should find code case-insensitively', () => {
      expect(isCodeInText('JAMZ1724AB12', 'Check out my post with code jamz1724ab12')).toBe(true);
      expect(isCodeInText('jamz1724ab12', 'Check out my post with code JAMZ1724AB12')).toBe(true);
    });

    it('should find code at start of text', () => {
      expect(isCodeInText('JAMZ1724AB12', 'JAMZ1724AB12 is my verification code')).toBe(true);
    });

    it('should find code at end of text', () => {
      expect(isCodeInText('JAMZ1724AB12', 'My verification code is JAMZ1724AB12')).toBe(true);
    });

    it('should not find code if not present', () => {
      expect(isCodeInText('JAMZ1724AB12', 'No code here')).toBe(false);
      expect(isCodeInText('JAMZ1724AB12', 'JAMZ1724AB11')).toBe(false);
    });

    it('should handle empty or null inputs', () => {
      expect(isCodeInText('JAMZ1724AB12', '')).toBe(false);
      expect(isCodeInText('JAMZ1724AB12', null)).toBe(false);
      expect(isCodeInText('', 'JAMZ1724AB12')).toBe(false);
      expect(isCodeInText(null, 'JAMZ1724AB12')).toBe(false);
    });
  });

  describe('extractCodesFromText', () => {
    it('should extract single code from text', () => {
      const codes = extractCodesFromText('My code is JAMZ1724AB12');
      expect(codes).toEqual(['JAMZ1724AB12']);
    });

    it('should extract multiple codes from text', () => {
      const codes = extractCodesFromText('Code 1: JAMZ1724AB12 and Code 2: JAMZ9999ZZZZ');
      expect(codes).toContain('JAMZ1724AB12');
      expect(codes).toContain('JAMZ9999ZZZZ');
      expect(codes.length).toBe(2);
    });

    it('should extract codes case-insensitively', () => {
      const codes = extractCodesFromText('jamz1724ab12 and JAMZ9999ZZZZ');
      expect(codes.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array if no codes found', () => {
      const codes = extractCodesFromText('No codes here');
      expect(codes).toEqual([]);
    });

    it('should handle empty or null inputs', () => {
      expect(extractCodesFromText('')).toEqual([]);
      expect(extractCodesFromText(null)).toEqual([]);
      expect(extractCodesFromText(undefined)).toEqual([]);
    });

    it('should normalize extracted codes to uppercase', () => {
      const codes = extractCodesFromText('jamz1724ab12');
      expect(codes[0]).toBe('JAMZ1724AB12');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle real-world post metadata', () => {
      const postTitle = 'Check out my amazing content!';
      const postDescription = 'Don\'t forget to use my code JAMZ1724AB12 for verification. Thanks!';
      const userCode = 'JAMZ1724AB12';

      const metadataText = `${postTitle} ${postDescription}`;
      expect(isCodeInText(userCode, metadataText)).toBe(true);
    });

    it('should verify code in title or description', () => {
      const userCode = 'JAMZ1724AB12';
      
      // Code in title
      expect(isCodeInText(userCode, 'JAMZ1724AB12 - My Post Title')).toBe(true);
      
      // Code in description
      expect(isCodeInText(userCode, 'This is my post description with JAMZ1724AB12')).toBe(true);
      
      // Code in both
      expect(isCodeInText(userCode, 'JAMZ1724AB12 Title with JAMZ1724AB12 in description')).toBe(true);
    });

    it('should handle multiple codes in post', () => {
      const userCode = 'JAMZ1724AB12';
      const postText = 'Use JAMZ1724AB12 or JAMZ9999ZZZZ for verification';
      
      expect(isCodeInText(userCode, postText)).toBe(true);
      
      const foundCodes = extractCodesFromText(postText);
      expect(foundCodes).toContain('JAMZ1724AB12');
      expect(foundCodes).toContain('JAMZ9999ZZZZ');
    });
  });
});

