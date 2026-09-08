/**
 * Edge-compatible Authentication & Cryptography Utilities
 * Uses standard Web Crypto API supported by Cloudflare Workers and modern Node.js.
 */

export const SESSION_COOKIE_NAME = "qleading_session";
export const SESSION_EXPIRY_DAYS = 30;

/**
 * Converts an ArrayBuffer to a hex string.
 */
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

/**
 * Generates a random cryptographic hex salt.
 */
export function generateSalt(length = 16): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bufferToHex(bytes.buffer);
}

/**
 * Hashes a password with a cryptographic salt using SHA-256.
 */
export async function hashPassword(
  password: string,
  existingSalt?: string
): Promise<{ hash: string; salt: string }> {
  const salt = existingSalt || generateSalt();
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${password}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hash = bufferToHex(hashBuffer);
  return { hash, salt };
}

/**
 * Verifies if an input password matches the stored salt and hash.
 */
export async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string
): Promise<boolean> {
  const { hash } = await hashPassword(password, salt);
  return hash === expectedHash;
}

/**
 * Generates a secure session token.
 */
export function generateSessionToken(): string {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bufferToHex(bytes.buffer);
}

/**
 * Generates random account credentials.
 * Helpful for instant zero-friction user registration with Cloudflare sync.
 */
export function generateRandomCredentials(): {
  username: string;
  email: string;
  password: string;
} {
  const prefixes = [
    "Qari",
    "Reader",
    "Tadabbur",
    "Seeker",
    "Hafiz",
    "Talib",
    "Noor",
    "Sabr",
    "Bayan",
    "Mubin",
    "Amanah",
    "Fajr",
  ];

  const randPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const username = `${randPrefix}_${randNum}`;
  const email = `${randPrefix.toLowerCase()}_${randNum}@qleading.app`;

  // 8 random alphanumeric characters password
  const randChars = Math.random().toString(36).substring(2, 10);
  const password = `ql-${randChars}`;

  return { username, email, password };
}

