import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DevSettings } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    if (__DEV__) console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="alert-circle" size={56} color="#EF4444" />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.sub}>A refresh fixed it? Reload the app to continue.</Text>
          <TouchableOpacity style={styles.btn} onPress={() => DevSettings.reload()} activeOpacity={0.85}>
            <Text style={styles.btnText}>Reload App</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#F8FAFC' },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginTop: 16 },
  sub: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 8, marginBottom: 24 },
  btn: { backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
