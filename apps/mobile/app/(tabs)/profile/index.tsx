import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '@/stores/auth-store';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user?.lastName?.charAt(0) ?? 'U'}
        </Text>
      </View>

      <Text style={styles.name}>
        {user ? `${user.lastName} ${user.firstName}` : 'Sinh vien'}
      </Text>
      <Text style={styles.studentId}>{user?.studentId ?? ''}</Text>
      <Text style={styles.email}>{user?.email ?? ''}</Text>

      <Pressable style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Dang xuat</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    backgroundColor: '#F3F4F6',
    padding: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  studentId: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  email: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  logoutButton: {
    marginTop: 40,
    paddingVertical: 14,
    paddingHorizontal: 48,
    backgroundColor: '#EF4444',
    borderRadius: 12,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
