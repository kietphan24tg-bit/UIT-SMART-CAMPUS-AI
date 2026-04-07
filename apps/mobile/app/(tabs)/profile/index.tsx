import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ContentStack, EmptyState, Screen, SectionCard, StatusBadge, TopHero } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { getGreetingName, getRoleLabel, isAdminRole, isLecturerRole, isSuperAdminRole } from '@/utils/app';

export default function ProfileScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <Screen>
      <TopHero
        eyebrow="Profile overview"
        title={getGreetingName(user)}
        subtitle="Tong hop thong tin tai khoan, quyen hien tai va duong vao cac nhom thiet lap quan trong."
        badge={{ label: getRoleLabel(user?.role), tone: 'info' }}
      />

      <ContentStack>
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: theme.colors.primarySurface,
              },
            ]}
          >
            <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
              {user?.lastName?.charAt(0) ?? 'U'}
            </Text>
          </View>
          <Text style={[styles.name, { color: theme.colors.text }]}>{getGreetingName(user)}</Text>
          <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
            {user?.studentId || 'Chua co ma dinh danh'} · {user?.email || 'Chua co email'}
          </Text>
          {user ? <StatusBadge label={getRoleLabel(user.role)} tone="info" /> : null}
        </View>

        <SectionCard title="Vai tro & entry points" subtitle="Cac loi vao role-specific duoc dat ro rang de user khong bi lac.">
          <View style={styles.linkGroup}>
            {isLecturerRole(user?.role) ? (
              <ProfileLink
                icon="school-outline"
                label="Tac vu giang day"
                description="Class dashboard, attendance QR, grade sheet, thong bao lop"
                onPress={() => router.push('/schedule/class-dashboard')}
              />
            ) : null}
            {isAdminRole(user?.role) ? (
              <ProfileLink
                icon="pulse-outline"
                label="Trung tam van hanh"
                description="Approvals, fire alerts, user summary, parking ops"
                onPress={() => router.push('/schedule')}
              />
            ) : null}
            {isSuperAdminRole(user?.role) ? (
              <ProfileLink
                icon="settings-outline"
                label="System controls"
                description="Role management, gateway config, retention policy"
                onPress={() => router.push('/settings/system-controls')}
              />
            ) : null}
          </View>
        </SectionCard>

        <SectionCard title="Cai dat & ho tro" subtitle="Nhom entry danh cho account, phap ly va ho tro su dung.">
          <View style={styles.linkGroup}>
            <ProfileLink
              icon="settings-outline"
              label="Tai khoan & ho tro"
              description="Mat khau, ho tro, about, dang xuat"
              onPress={() => router.push('/settings')}
            />
            <ProfileLink
              icon="shield-checkmark-outline"
              label="Quyen rieng tu & phap ly"
              description="Privacy, terms, permissions, data usage"
              onPress={() => router.push('/legal')}
            />
            <ProfileLink
              icon="trash-outline"
              label="Xoa tai khoan"
              description="Diem vao rieng cho account deletion"
              onPress={() => router.push('/account/delete')}
            />
          </View>
        </SectionCard>

        <SectionCard title="Trang thai tai khoan" subtitle="Thong tin ngan gon de nguoi dung hieu boi canh hien tai.">
          {user ? (
            <View style={styles.linkGroup}>
              <Text style={[styles.metaLeft, { color: theme.colors.textMuted }]}>
                Role hien tai quyet dinh tab thu hai, quick actions va cac hidden task routes duoc mo tren mobile.
              </Text>
            </View>
          ) : (
            <EmptyState
              icon="person-outline"
              title="Chua co du lieu ho so"
              description="App se dua ban ve auth neu phien dang nhap khong con hieu luc."
            />
          )}
        </SectionCard>

        <Pressable
          onPress={() => void logout()}
          style={[
            styles.logoutButton,
            {
              backgroundColor: theme.colors.dangerSurface,
              borderColor: theme.colors.danger,
            },
          ]}
        >
          <Ionicons name="log-out-outline" size={20} color={theme.colors.danger} />
          <Text style={[styles.logoutText, { color: theme.colors.danger }]}>Dang xuat</Text>
        </Pressable>
      </ContentStack>
    </Screen>
  );
}

function ProfileLink({
  icon,
  label,
  description,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.profileLink,
        {
          backgroundColor: theme.colors.surfaceSubtle,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: theme.colors.primarySurface,
          },
        ]}
      >
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.linkLabel, { color: theme.colors.text }]}>{label}</Text>
        <Text style={[styles.linkDescription, { color: theme.colors.textMuted }]}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textSoft} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '800',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  metaLeft: {
    fontSize: 13,
    lineHeight: 18,
  },
  linkGroup: {
    gap: 10,
  },
  profileLink: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  linkDescription: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
  },
  logoutButton: {
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexDirection: 'row',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
