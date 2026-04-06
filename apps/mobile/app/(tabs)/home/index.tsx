import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '@/stores/auth-store';

const QUICK_ACTIONS = [
  {
    icon: 'car-sport' as const,
    label: 'Parking',
    color: '#1E40AF',
    route: '/parking',
  },
  { icon: 'calendar' as const, label: 'Thoi khoa bieu', color: '#3B82F6' },
  { icon: 'school' as const, label: 'Diem / GPA', color: '#10B981' },
  { icon: 'chatbubble' as const, label: 'AI Chatbot', color: '#8B5CF6' },
  { icon: 'megaphone' as const, label: 'Su kien', color: '#F59E0B' },
  { icon: 'book' as const, label: 'Thu vien', color: '#EF4444' },
  { icon: 'map' as const, label: 'Ban do', color: '#06B6D4' },
];

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Xin chao, {user?.firstName ?? 'Sinh vien'}!
        </Text>
        <Text style={styles.subGreeting}>Smart Campus UIT</Text>
      </View>

      <View style={styles.grid}>
        {QUICK_ACTIONS.map((action) => (
          <Pressable
            key={action.label}
            style={styles.card}
            onPress={() => {
              if (action.route) {
                router.push(action.route as never);
              }
            }}
          >
            <View style={[styles.iconContainer, { backgroundColor: action.color + '15' }]}>
              <Ionicons name={action.icon} size={28} color={action.color} />
            </View>
            <Text style={styles.cardLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thong bao moi</Text>
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>Chua co thong bao moi</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subGreeting: {
    fontSize: 14,
    color: '#93C5FD',
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  card: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyText: {
    marginTop: 8,
    color: '#9CA3AF',
    fontSize: 14,
  },
});
