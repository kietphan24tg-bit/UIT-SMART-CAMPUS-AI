import { Link, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ContentStack, FormField, PrimaryButton, Screen, StatusBadge, TopHero } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';

type AuthMode = 'login' | 'register';

interface AuthScreenProps {
  initialMode?: AuthMode;
}

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  studentId: string;
  firstName: string;
  lastName: string;
}

const EMPTY_REGISTER_FORM: RegisterForm = {
  email: '',
  password: '',
  confirmPassword: '',
  studentId: '',
  firstName: '',
  lastName: '',
};

function isValidUitEmail(value: string) {
  return /@(gm\.)?uit\.edu\.vn$/i.test(value.trim());
}

function isValidPassword(value: string) {
  return /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);
}

export function AuthScreen({ initialMode = 'login' }: AuthScreenProps) {
  const theme = useAppTheme();
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerForm, setRegisterForm] = useState<RegisterForm>(EMPTY_REGISTER_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const title = useMemo(
    () => (mode === 'login' ? 'Đăng nhập một lần, dùng cả campus' : 'Tạo tài khoản UIT Smart Campus'),
    [mode],
  );

  const subtitle = useMemo(
    () =>
      mode === 'login'
        ? 'Tập trung lịch học, cảnh báo, parking và dịch vụ trong một ứng dụng đồng nhất.'
        : 'Đăng ký với email UIT và MSSV để dùng các dịch vụ cốt lõi của hệ thống.',
    [mode],
  );

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
    setSuccess('');
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await login(email.trim(), password);
      router.replace('/home');
    } catch {
      setError('Email hoặc mật khẩu chưa chính xác.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const payload = {
      email: registerForm.email.trim(),
      password: registerForm.password,
      studentId: registerForm.studentId.trim(),
      firstName: registerForm.firstName.trim(),
      lastName: registerForm.lastName.trim(),
    };

    if (Object.values(payload).some((item) => !item)) {
      setError('Vui lòng điền đầy đủ thông tin đăng ký.');
      return;
    }

    if (!isValidUitEmail(payload.email)) {
      setError('Email đăng ký cần thuộc tên miền UIT.');
      return;
    }

    if (!isValidPassword(payload.password)) {
      setError('Mật khẩu cần từ 8 ký tự, có ít nhất 1 chữ in hoa và 1 số.');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Mật khẩu xác nhận chưa khớp.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await register(payload);
      router.replace('/home');
    } catch {
      setError('Đăng ký chưa thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const updateRegisterField = (key: keyof RegisterForm, value: string) => {
    setRegisterForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: theme.spacing.xxl,
        }}
      >
        <TopHero
          eyebrow="UIT Smart Campus"
          title={mode === 'login' ? 'Chào mừng trở lại' : 'Khởi tạo tài khoản'}
          subtitle="Thiết kế thống nhất cho cả light mode, dark mode và trải nghiệm sử dụng thực tế của UITer."
          badge={{ label: mode === 'login' ? 'Đăng nhập nhanh' : 'Đăng ký chuẩn UIT', tone: 'info' }}
        />

        <ContentStack narrow>
          <View
            style={[
              styles.segment,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Pressable
              onPress={() => switchMode('login')}
              style={[
                styles.segmentButton,
                mode === 'login'
                  ? {
                      backgroundColor: theme.colors.primarySurface,
                    }
                  : null,
              ]}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  { color: mode === 'login' ? theme.colors.primary : theme.colors.textMuted },
                ]}
              >
                Đăng nhập
              </Text>
            </Pressable>
            <Pressable
              onPress={() => switchMode('register')}
              style={[
                styles.segmentButton,
                mode === 'register'
                  ? {
                      backgroundColor: theme.colors.primarySurface,
                    }
                  : null,
              ]}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  { color: mode === 'register' ? theme.colors.primary : theme.colors.textMuted },
                ]}
              >
                Đăng ký
              </Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>

            {error ? <StatusBadge label={error} tone="danger" /> : null}
            {success ? <StatusBadge label={success} tone="success" /> : null}

            {mode === 'login' ? (
              <View style={styles.form}>
                <FormField
                  label="Email UIT"
                  placeholder="student@gm.uit.edu.vn"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  hint="Dùng email UIT để truy cập đầy đủ dữ liệu học tập và thông báo."
                />
                <FormField
                  label="Mật khẩu"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  hint="Mật khẩu tối thiểu 8 ký tự."
                />
                <PrimaryButton
                  label="Đăng nhập"
                  loading={loading}
                  onPress={() => void handleLogin()}
                />
                <Link href="/forgot-password" style={styles.link}>
                  <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                    Quên mật khẩu?
                  </Text>
                </Link>
              </View>
            ) : (
              <View style={styles.form}>
                <FormField
                  label="Họ"
                  placeholder="Nguyễn"
                  value={registerForm.lastName}
                  onChangeText={(value) => updateRegisterField('lastName', value)}
                />
                <FormField
                  label="Tên"
                  placeholder="Văn A"
                  value={registerForm.firstName}
                  onChangeText={(value) => updateRegisterField('firstName', value)}
                />
                <FormField
                  label="MSSV"
                  placeholder="22520001"
                  value={registerForm.studentId}
                  onChangeText={(value) => updateRegisterField('studentId', value)}
                  keyboardType="number-pad"
                />
                <FormField
                  label="Email UIT"
                  placeholder="student@gm.uit.edu.vn"
                  value={registerForm.email}
                  onChangeText={(value) => updateRegisterField('email', value)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <FormField
                  label="Mật khẩu"
                  placeholder="Ít nhất 8 ký tự, 1 chữ hoa, 1 số"
                  value={registerForm.password}
                  onChangeText={(value) => updateRegisterField('password', value)}
                  secureTextEntry
                />
                <FormField
                  label="Xác nhận mật khẩu"
                  placeholder="Nhập lại mật khẩu"
                  value={registerForm.confirmPassword}
                  onChangeText={(value) => updateRegisterField('confirmPassword', value)}
                  secureTextEntry
                />
                <PrimaryButton
                  label="Tạo tài khoản"
                  loading={loading}
                  onPress={() => void handleRegister()}
                />
              </View>
            )}
          </View>
        </ContentStack>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1,
    padding: 6,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    gap: 14,
  },
  link: {
    marginTop: 4,
    alignSelf: 'center',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
