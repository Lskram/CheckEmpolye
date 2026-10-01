/**
 * Executive Route Obfuscation & Address Encryption Utility
 * Provides cryptographic token generation and URL masking for the Yokohama Executive Suite.
 */

export function generateEncryptedToken(): string {
  if (typeof window === 'undefined') {
    return '0x7F9B1E4A8D2C5E0F';
  }
  const array = new Uint8Array(8);
  window.crypto.getRandomValues(array);
  const hex = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `0x${hex}`;
}

export function getEncryptedExecutiveRoute(): string {
  const token = generateEncryptedToken();
  const sessionHash = Math.random().toString(36).substring(2, 10);
  return `/console/${token}?vault_session=sec_${sessionHash}`;
}

export function maskBrowserUrlToEncrypted(tokenOverride?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const token = tokenOverride || generateEncryptedToken();
    const sessionHash = Math.random().toString(36).substring(2, 10);
    const maskedUrl = `/console/${token}?vault_id=sec_sha256_${sessionHash}`;
    
    // Smoothly replace the address bar without triggering page reload
    window.history.replaceState(null, '', maskedUrl);
  } catch (e) {
    console.error('URL masking error:', e);
  }
}
