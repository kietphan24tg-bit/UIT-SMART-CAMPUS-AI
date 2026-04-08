import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ContentStack, FormField, PrimaryButton, Screen, TopHero } from '@/components/ui';
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
  const [loading, setLoading] = useState(false);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
  };

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

  const handleRegister = async () => {
    const payload = {
      email: registerForm.email.trim(),
      password: registerForm.password,
      studentId: registerForm.studentId.trim(),
      firstName: registerForm.firstName.trim(),
      lastName: registerForm.lastName.trim(),
    };

    if (Object.values(payload).some((item) => !item)) {
      setError('Vui lòng điền đủ thông tin.');
      return;
    }

    if (!isValidUitEmail(payload.email)) {
      setError('Email cần thuộc miền UIT.');
      return;
    }

    if (!isValidPassword(payload.password)) {
      setError('Mật khẩu tối thiểu 8 ký tự, có 1 chữ hoa và 1 số.');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Mật khẩu xác nhận chưa khớp.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register(payload);
      router.replace('/home');
    } catch {
      setError('Đăng ký chưa thành công. Vui lòng thử lại.');
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
          paddingBottom: theme.spacing.xl,
        }}
      >
        <TopHero
          title={mode === 'login' ? 'Đăng nhập tài khoản UIT' : 'Tạo tài khoản UIT'}
          subtitle={mode === 'login' ? 'Tiếp tục với email UIT của bạn.' : 'Điền thông tin để bắt đầu sử dụng ứng dụng.'}
          showBrand
          brandCompact
          brandCentered
          brandShowSubtitle={false}
        />

        <ContentStack narrow overlapHero={false}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.segment,
                {
                  backgroundColor: theme.colors.surfaceSubtle,
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
                    {
                      color: mode === 'login' ? theme.colors.primary : theme.colors.textMuted,
                      fontFamily: theme.fonts.semibold,
                    },
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
                    {
                      color: mode === 'register' ? theme.colors.primary : theme.colors.textMuted,
                      fontFamily: theme.fonts.semibold,
                    },
                  ]}
                >
                  Đăng ký
                </Text>
              </Pressable>
            </View>

            <Text style={[styles.formTitle, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>
              {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </Text>

            {error ? (
              <Text style={[styles.errorText, { color: theme.colors.danger, fontFamily: theme.fonts.medium }]}>
                {error}
              </Text>
            ) : null}

            {mode === 'login' ? (
              <View style={styles.form}>
                <FormField
                  label="Email UIT"
                  placeholder="student@gm.uit.edu.vn"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <FormField
                  label="Mật khẩu"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                <PrimaryButton label="Đăng nhập" loading={loading} onPress={() => void handleLogin()} />
                <Link href="/forgot-password" style={styles.link}>
                  <Text style={[styles.linkText, { color: theme.colors.primary, fontFamily: theme.fonts.semibold }]}>
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
                  placeholder="Ít nhất 8 ký tự"
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
                <PrimaryButton label="Tạo tài khoản" loading={loading} onPress={() => void handleRegister()} />
              </View>
            )}
          </View>
        </ContentStack>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  segmentLabel: {
    fontSize: 14,
  },
  formTitle: {
    fontSize: 18,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
  },
  form: {
    gap: 12,
  },
  link: {
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  linkText: {
    fontSize: 14,
  },
});
