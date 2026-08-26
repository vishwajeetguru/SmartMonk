import * as Clipboard from 'expo-clipboard';
import { Linking, Alert } from 'react-native';

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    Alert.alert('Error', 'Failed to copy');
    return false;
  }
}

export async function shareOnWhatsApp(text: string): Promise<void> {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  try {
    const can = await Linking.canOpenURL(url);
    if (can) await Linking.openURL(url);
    else Alert.alert('WhatsApp not available');
  } catch {
    Alert.alert('Error', 'Failed to share on WhatsApp');
  }
}
