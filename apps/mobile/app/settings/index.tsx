import { useRouter } from 'expo-router';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { ContentStack, Screen, SectionCard, SecondaryButton, TopHero } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { getRoleLabel, isAdminRole, isSuperAdminRole } from '@/utils/app';

export default function SettingsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const role = useAuthStore((state) => state.user?.role);

  return (
    <Screen>
      <TopHero
        eyebrow="Settings & support"
        title="Thiet lap tai khoan"
        subtitle="Gom account, support, policy va logout trong mot man de quet thay vi tach qua nhieu reader screen."
        badge={{ label: getRoleLabel(role), tone: 'info' }}
      />

      <ContentStack narrow>
        <SectionCard title="Account & security" subtitle="Tac vu lien quan toi phien dang nhap va thong tin co ban.">
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>
            Mat khau hien duoc quan ly qua flow dang nhap va khoi phuc tai khoan. Cac thay doi sau hon se duoc bo sung o pass backend tiep theo.
          </Text>
        </SectionCard>

        {isAdminRole(role) ? (
          <SectionCard
            title={isSuperAdminRole(role) ? 'System controls' : 'Operations shortcut'}
            subtitle="Role-aware settings giup Admin va Super Admin khong phai di long vong qua nhieu man."
          >
            <View style={styles.column}>
              <Text style={[styles.body, { color: theme.colors.textMuted }]}>
                {isSuperAdminRole(role)
                  ? 'Super Admin co them role management, gateway config va retention policy trong settings family.'
                  : 'Admin co shortcut ve Operations va queue can giam sat.'}
              </Text>
              {isSuperAdminRole(role) ? (
                <SecondaryButton
                  label="Mo system controls"
                  onPress={() => router.push('/settings/system-controls')}
                />
              ) : (
                <SecondaryButton
                  label="Mo Operations"
                  onPress={() => router.push('/schedule')}
                />
              )}
            </View>
          </SectionCard>
        ) : null}

        <SectionCard title="Help & support" subtitle="Diem vao ho tro va about cua ung dung.">
          <View style={styles.column}>
            <Text style={[styles.body, { color: theme.colors.textMuted }]}>
              Can tro giup? Lien he nhom phat trien qua email support de duoc huong dan ve tai khoan, parking hoac loi he thong.
            </Text>
            <SecondaryButton
              label="Gui email ho tro"
              onPress={() => void Linking.openURL('mailto:support@uit.edu.vn')}
            />
            <SecondaryButton
              label="Xem thong tin truong UIT"
              onPress={() => void Linking.openURL('https://uit.edu.vn')}
            />
          </View>
        </SectionCard>

        <SecondaryButton label="Dang xuat" onPress={() => void logout()} />
      </ContentStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  column: {
    gap: 12,
  },
});
