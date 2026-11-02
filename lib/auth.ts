import crypto from 'crypto';

/**
 * ============================================================================
 * Reviewer Committee Authentication Helper
 * ============================================================================
 * Handles server-side passcode verification and HttpOnly cookie session management.
 * Credentials are never passed in URLs; authenticated sessions are established
 * via cryptographically signed HttpOnly cookies.
 */

export const AUTH_COOKIE_NAME = 'mc_committee_session';

// Private secret key used for signing session tokens
const SESSION_SECRET = process.env.SESSION_SECRET || 'monday_club_scholarship_secure_secret_key_v1';

/**
 * Passcode validation:
 * Supports dynamic cycle passcode 'Monday{currentYear}' as well as default 'Monday2026'.
 */
export function isValidPasscode(passcode: string): boolean {
  if (!passcode || typeof passcode !== 'string') return false;
  
  const currentYear = new Date().getFullYear();
  const validPasscodes = [
    'monday2026',
    `monday${currentYear}`,
  ];

  return validPasscodes.includes(passcode.trim().toLowerCase());
}

/**
 * Create a cryptographically signed session token:
 * Formats token as timestamp.signature using HMAC-SHA256.
 * Guarantees tokens cannot be spoofed or forged by clients.
 */
export function createSessionToken(): string {
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(timestamp)
    .digest('hex');

  // Format: timestamp.signature
  return `${timestamp}.${signature}`;
}

/**
 * Verify a session token:
 * Checks HMAC signature validity and ensures token has not exceeded 24-hour expiration.
 */
export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [timestampStr, providedSignature] = parts;
  const timestamp = parseInt(timestampStr, 10);

  // Validate numeric timestamp
  if (isNaN(timestamp)) return false;

  // Check 24-hour expiration window (86,400,000 ms)
  const maxAgeMs = 24 * 60 * 60 * 1000;
  if (Date.now() - timestamp > maxAgeMs) {
    return false; // Token expired
  }

  // Recompute expected HMAC signature
  const expectedSignature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(timestampStr)
    .digest('hex');

  // Use timing-safe comparison to prevent timing attacks
  try {
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const providedBuffer = Buffer.from(providedSignature, 'hex');
    if (expectedBuffer.length !== providedBuffer.length) return false;
    return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  } catch {
    return false;
  }
}

/**
 * Cookie options helper:
 * - httpOnly: true (prevents client JavaScript XSS access)
 * - secure: HTTPS only in production
 * - sameSite: 'lax' (CSRF protection)
 * - maxAge: 24 hours (or 0 for logout)
 */
export function getAuthCookieOptions(isLogout = false) {
  return {
    name: AUTH_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: isLogout ? 0 : 60 * 60 * 24, // 24 hours
  };
}
