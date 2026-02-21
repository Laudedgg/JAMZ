/**
 * Unique Code Generator for Campaign Verification
 * Generates 4-digit codes that are stored in the database
 * Display format: JAMZ + 4 digits (e.g., JAMZ4287)
 * Storage format: 4 digits only (e.g., 4287)
 */

/**
 * Generate a unique verification code
 * Returns only the 4-digit code for database storage
 * Frontend should prepend "JAMZ" when displaying to users
 *
 * @returns {string} Generated 4-digit code (e.g., "4287")
 */
export function generateUniqueCode() {
  // Generate random 4-digit code (1000-9999)
  const code = String(Math.floor(1000 + Math.random() * 9000));
  return code;
}

/**
 * Validate a unique code format
 * Supports both old format (JAMZ + 4 digits + 4 alphanumeric) and new format (JAMZ + 4 digits)
 *
 * @param {string} code - Code to validate
 * @returns {boolean} True if code matches the expected format
 */
export function validateCodeFormat(code) {
  // New format: JAMZ + 4 digits
  const newCodeRegex = /^JAMZ\d{4}$/;
  // Old format: JAMZ + 4 digits + 4 alphanumeric (for backwards compatibility)
  const oldCodeRegex = /^JAMZ\d{4}[A-Z0-9]{4}$/;
  return newCodeRegex.test(code) || oldCodeRegex.test(code);
}

/**
 * Check if a code exists in text (title, description, etc.)
 * Performs case-insensitive search
 * Looks for JAMZ + the 4-digit code (e.g., JAMZ4287)
 *
 * @param {string} code - 4-digit code to search for (e.g., "4287")
 * @param {string} text - Text to search in
 * @returns {boolean} True if code is found in text
 */
export function isCodeInText(code, text) {
  if (!code || !text) return false;
  // Remove "JAMZ" prefix if it exists in the code parameter
  const cleanCode = code.replace(/^JAMZ/i, '');
  // Search for JAMZ + the code
  const searchPattern = `JAMZ${cleanCode}`;
  return text.toUpperCase().includes(searchPattern.toUpperCase());
}

/**
 * Extract all potential codes from text
 * Useful for debugging and verification
 * Supports both old and new formats
 *
 * @param {string} text - Text to search in
 * @returns {string[]} Array of found codes
 */
export function extractCodesFromText(text) {
  if (!text) return [];
  // Match both old format (JAMZ + 4 digits + 4 alphanumeric) and new format (JAMZ + 4 digits)
  const newCodeRegex = /JAMZ\d{4}(?![A-Z0-9])/gi; // JAMZ + 4 digits NOT followed by alphanumeric
  const oldCodeRegex = /JAMZ\d{4}[A-Z0-9]{4}/gi; // JAMZ + 4 digits + 4 alphanumeric

  const newMatches = text.match(newCodeRegex) || [];
  const oldMatches = text.match(oldCodeRegex) || [];

  const allMatches = [...newMatches, ...oldMatches];
  return allMatches.map(code => code.toUpperCase());
}

export default {
  generateUniqueCode,
  validateCodeFormat,
  isCodeInText,
  extractCodesFromText
};

