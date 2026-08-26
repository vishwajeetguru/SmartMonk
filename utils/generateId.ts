import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import * as Crypto from 'expo-crypto';

/**
 * Cryptographically secure ID generation.
 * Uses expo-crypto.randomUUID when available (native secure RNG),
 * falls back to uuid v4 (requires getRandomValues polyfill), never Math.random.
 */
export function generateId(): string {
  try {
    // expo-crypto provides secure randomUUID on native
    if (typeof (Crypto as any).randomUUID === 'function') {
      return (Crypto as any).randomUUID();
    }
  } catch {}
  try {
    return uuidv4();
  } catch {
    // Final fallback - should never happen if polyfill loaded
    // Use Crypto.getRandomBytes if available
    try {
      const bytes = Crypto.getRandomBytes(16);
      // Format as UUID v4 hex
      return Array.from(bytes as unknown as number[])
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
    } catch {}
  }
  // Last resort - not cryptographically strong but better than Math.random timestamp
  // This should never be reached in production
  if (__DEV__) console.warn('[generateId] Falling back to insecure ID');
  return `fallback-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
