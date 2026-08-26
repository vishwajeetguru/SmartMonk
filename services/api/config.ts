import Constants from 'expo-constants';

// Secure API configuration
// Production MUST use https via EXPO_PUBLIC_API_URL. Hardcoded LAN IP is dev-only fallback.
const PROD_FALLBACK = 'https://api.smartmonk.app/api/v1';
const DEV_LAN_FALLBACK = 'http://192.168.1.6:3000/api/v1';

function getDefaultBaseUrl(): string {
  // In production, never infer http host - use secure fallback
  if (!__DEV__) {
    return PROD_FALLBACK;
  }

  // Dev only: try to infer host for Expo Go LAN debugging
  const hostUri = (Constants.expoConfig as any)?.hostUri || (Constants as any)?.manifest?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:3000/api/v1`;
    }
  }
  const debuggerHost =
    (Constants as any)?.expoGoConfig?.debuggerHost ||
    (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost;
  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    if (host) return `http://${host}:3000/api/v1`;
  }
  return DEV_LAN_FALLBACK;
}

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || getDefaultBaseUrl();

// Security: warn if using insecure http in production
if (!__DEV__ && API_BASE_URL.startsWith('http://')) {
  console.warn('[API] Insecure http URL in production - set EXPO_PUBLIC_API_URL to https://');
}

// Only log in dev, never expose internal IP in production logs
if (__DEV__) {
  // eslint-disable-next-line no-console
  console.log('[API] Base URL:', API_BASE_URL);
}
