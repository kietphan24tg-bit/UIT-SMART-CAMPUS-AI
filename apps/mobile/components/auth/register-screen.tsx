import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import RegisterHero from '../../assets/auth/register-hero.jpg';

import { AuthShell } from './auth-shell';

import { FormField, PrimaryButton } from '@/components/ui';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';

interface RegisterFormState {
  email: string;
  password: string;
  confirmPassword: string;
  studentId: string;
  firstName: string;
  lastName: string;
}

const EMPTY_REGISTER_FORM: RegisterFormState = {
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

export function RegisterScreen() {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const register = useAuthStore((state) => state.register);
  const [form, setForm] = useState<RegisterFormState>(EMPTY_REGISTER_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (key: keyof RegisterFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    const payload = {
      email: form.email.trim(),
      password: form.password,
      studentId: form.studentId.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
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

    if (form.password !== form.confirmPassword) {
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

  const isWideForm = layout.isTablet || layout.isExtraLargePhone;
  const isDisabled =
    loading ||
    !form.lastName.trim() ||
    !form.firstName.trim() ||
    !form.studentId.trim() ||
    !form.email.trim() ||
    !form.password.trim() ||
    !form.confirmPassword.trim();

  return (
    <AuthShell
      heroImage={RegisterHero}
      heroPosition={{ top: '16%', left: '78%' }}
      heroAlt="Tòa nhà UIT với máy bay trên bầu trời"
      heroLabel="Tài khoản mới"
      displayTitle="Bắt Đầu"
      displaySubtitle="Gia nhập UIT Campus theo cách thật dễ dàng"
      panelTitle="Tạo tài khoản"
      panelSubtitle="Hoàn tất vài thông tin cơ bản để mở khóa lịch học, dịch vụ campus và các tiện ích sinh viên."
      footer={
        <Pressable
          accessibilityRole="link"
          onPress={() => router.replace('/login')}
          style={styles.footerLink}
        >
          <Text
            style={[
              styles.footerText,
              { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
            ]}
          >
            Đã có tài khoản?{' '}
            <Text
              style={[
                styles.footerTextStrong,
                { color: theme.colors.primary, fontFamily: theme.fonts.semibold },
              ]}
            >
              Đăng nhập
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
        <View style={[styles.row, isWideForm ? styles.rowWide : null]}>
          <View style={styles.rowField}>
            <FormField
              label="Họ"
              placeholder="Nguyễn"
              value={form.lastName}
              onChangeText={(value) => updateField('lastName', value)}
              leftIcon="user"
            />
          </View>
          <View style={styles.rowField}>
            <FormField
              label="Tên"
              placeholder="Văn A"
              value={form.firstName}
              onChangeText={(value) => updateField('firstName', value)}
              leftIcon="user"
            />
          </View>
        </View>

        <FormField
          label="MSSV"
          placeholder="22520001"
          value={form.studentId}
          onChangeText={(value) => updateField('studentId', value)}
          keyboardType="number-pad"
          leftIcon="hash"
        />
        <FormField
          label="Email sinh viên"
          placeholder="student@gm.uit.edu.vn"
          value={form.email}
          onChangeText={(value) => updateField('email', value)}
          autoCapitalize="none"
          keyboardType="email-address"
          leftIcon="mail"
        />

        <View style={[styles.row, isWideForm ? styles.rowWide : null]}>
          <View style={styles.rowField}>
            <FormField
              label="Mật khẩu"
              placeholder="Ít nhất 8 ký tự"
              value={form.password}
              onChangeText={(value) => updateField('password', value)}
              secureTextEntry
              secureToggle
              leftIcon="lock"
            />
          </View>
          <View style={styles.rowField}>
            <FormField
              label="Xác nhận mật khẩu"
              placeholder="Nhập lại mật khẩu"
              value={form.confirmPassword}
              onChangeText={(value) => updateField('confirmPassword', value)}
              secureTextEntry
              secureToggle
              leftIcon="shield"
            />
          </View>
        </View>
      </View>

      <PrimaryButton
        label="Tạo tài khoản"
        loading={loading}
        disabled={isDisabled}
        onPress={() => void handleRegister()}
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
  row: {
    gap: 14,
  },
  rowWide: {
    flexDirection: 'row',
  },
  rowField: {
    flex: 1,
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
