import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuthStore } from '@/stores/auth-store';

export default function RegisterScreen() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    studentId: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);

  const handleRegister = async () => {
    const { email, password, studentId, firstName, lastName } = form;
    if (!email || !password || !studentId || !firstName || !lastName) {
      setError('Vui long nhap day du thong tin');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(form);
      router.replace('/(tabs)/home');
    } catch {
      setError('Dang ky that bai. Vui long thu lai.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Tao tai khoan</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Ho"
          value={form.lastName}
          onChangeText={(v) => updateField('lastName', v)}
          placeholderTextColor="#9CA3AF"
        />
        <TextInput
          style={styles.input}
          placeholder="Ten"
          value={form.firstName}
          onChangeText={(v) => updateField('firstName', v)}
          placeholderTextColor="#9CA3AF"
        />
        <TextInput
          style={styles.input}
          placeholder="MSSV (8 so)"
          value={form.studentId}
          onChangeText={(v) => updateField('studentId', v)}
          keyboardType="number-pad"
          maxLength={8}
          placeholderTextColor="#9CA3AF"
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={form.email}
          onChangeText={(v) => updateField('email', v)}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#9CA3AF"
        />
        <TextInput
          style={styles.input}
          placeholder="Mat khau (8+ ky tu, 1 hoa, 1 so)"
          value={form.password}
          onChangeText={(v) => updateField('password', v)}
          secureTextEntry
          placeholderTextColor="#9CA3AF"
        />

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Dang ky</Text>
          )}
        </Pressable>

        <Link href="/(auth)/login" style={styles.link}>
          <Text style={styles.linkText}>Da co tai khoan? Dang nhap</Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E40AF',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  button: {
    height: 50,
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  link: {
    marginTop: 20,
    alignSelf: 'center',
  },
  linkText: {
    color: '#1E40AF',
    fontSize: 14,
  },
});
