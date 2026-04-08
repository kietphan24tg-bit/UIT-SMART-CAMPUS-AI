import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import LoginHero from '../../assets/auth/login-hero.jpg';

import { AuthShell } from './auth-shell';

import { FormField, PrimaryButton } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';

export function LoginScreen() {
  const theme = useAppTheme();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Nhập đủ email và mật khẩu.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email.trim(), password);
      router.replace('/home');
    } catch {
      setError('Email hoặc mật khẩu chưa đúng.');
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || !email.trim() || !password.trim();

  return (
    <AuthShell
      heroImage={LoginHero}
      heroPosition={{ bottom: 0, left: '52%' }}
      heroAlt="Hình ảnh mascot UIT tại khuôn viên trường"
      heroLabel="Sinh viên UIT"
      displayTitle="Hello!"
      displaySubtitle="Chào mừng đến với UIT Campus"
      panelTitle="Đăng nhập"
      panelSubtitle="Tiếp tục với email sinh viên để sử dụng trọn bộ tiện ích học tập và đời sống trong campus."
      footer={
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/register')}
          style={styles.footerLink}
        >
          <Text
            style={[
              styles.footerText,
              { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
            ]}
          >
            Bạn chưa có tài khoản?{' '}
            <Text
              style={[
                styles.footerTextStrong,
                { color: theme.colors.primary, fontFamily: theme.fonts.semibold },
              ]}
            >
              Đăng ký tại đây
            </Text>
          </Text>
        </Pressable>
      }
    >
      {error ? (
        <View
          style={[
            styles.feedback,
            { backgroundColor: theme.colors.dangerSurface, borderColor: theme.colors.danger },
          ]}
        >
          <Text
            style={[
              styles.feedbackText,
              { color: theme.colors.danger, fontFamily: theme.fonts.medium },
            ]}
          >
            {error}
          </Text>
        </View>
      ) : null}

      <View style={styles.form}>
        <FormField
          label="Email sinh viên"
          placeholder="student@gm.uit.edu.vn"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon="mail"
        />
        <FormField
          label="Mật khẩu"
          placeholder="Nhập mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          secureToggle
          leftIcon="lock"
        />
      </View>

      <Pressable
        accessibilityRole="link"
        onPress={() => router.push('/forgot-password')}
        style={styles.inlineLink}
      >
        <Text
          style={[
            styles.inlineLinkText,
            { color: theme.colors.textMuted, fontFamily: theme.fonts.semibold },
          ]}
        >
          Mình quên mật khẩu rồi!
        </Text>
      </Pressable>

      <PrimaryButton
        label="Đăng nhập"
        loading={loading}
        disabled={isDisabled}
        onPress={() => void handleLogin()}
      />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  feedback: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  feedbackText: {
    fontSize: 13,
    lineHeight: 18,
  },
  form: {
    gap: 14,
  },
  inlineLink: {
    alignSelf: 'center',
    marginTop: -2,
  },
  inlineLinkText: {
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  footerLink: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  footerTextStrong: {
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});
