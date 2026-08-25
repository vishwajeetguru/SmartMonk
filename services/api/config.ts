import Constants from 'expo-constants';

// For Expo Go, localhost won't work from device - use LAN IP as seen in Metro logs (192.168.1.6)
// Set EXPO_PUBLIC_API_URL in .env to override
const LAN_FALLBACK = 'http://192.168.1.6:3000/api/v1';
const LOCAL_FALLBACK = 'http://localhost:3000/api/v1';

function getDefaultBaseUrl(): string {
  // Try to infer from Expo host
  const hostUri = (Constants.expoConfig as any)?.hostUri || (Constants as any)?.manifest?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:3000/api/v1`;
    }
  }
  // In Expo Go, Constants.manifest2?.extra?.expoGo?.debuggerHost
  const debuggerHost = (Constants as any)?.expoGoConfig?.debuggerHost || (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost;
  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    if (host) return `http://${host}:3000/api/v1`;
  }
  return LAN_FALLBACK;
}

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || getDefaultBaseUrl();

console.log('[API] Base URL:', API_BASE_URL);
