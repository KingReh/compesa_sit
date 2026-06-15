/**
 * Utility functions for cryptographic hashing and password validation for the SIT auth module.
 */

/**
 * Generates a SHA-256 hash of a string using the native Web Crypto API.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Password strength profile
 */
export type PasswordStrength = 'Fraca' | 'Média' | 'Forte';

/**
 * Calculates the strength of a password based on common corporate policies.
 */
export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) return 'Fraca';
  
  let score = 0;
  
  // Length criteria
  if (password.length >= 6) score += 1;
  if (password.length >= 8) score += 1;
  
  // Complexity criteria
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  
  const categoriesCount = [hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;
  
  if (categoriesCount >= 2) score += 1;
  if (categoriesCount >= 4) score += 1;
  
  if (password.length < 6) {
    return 'Fraca';
  }
  
  if (score >= 4) {
    return 'Forte';
  } else if (score >= 2) {
    return 'Média';
  } else {
    return 'Fraca';
  }
}
