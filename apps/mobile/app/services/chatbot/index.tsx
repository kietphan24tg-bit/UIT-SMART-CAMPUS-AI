import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  ContentStack,
  EmptyState,
  FormField,
  PrimaryButton,
  Screen,
  SectionCard,
  StatusBadge,
  TopHero,
} from '@/components/ui';
import { chatbotApi } from '@/services/api/chatbot';
import { useAppTheme } from '@/theme';

export default function ChatbotScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const sessionsQuery = useQuery({
    queryKey: ['chatbot', 'sessions'],
    queryFn: () => chatbotApi.listSessions(),
  });
  const messagesQuery = useQuery({
    queryKey: ['chatbot', 'messages', sessionId],
    queryFn: () => chatbotApi.getMessages(sessionId!),
    enabled: Boolean(sessionId),
  });

  const queryMutation = useMutation({
    mutationFn: () =>
      chatbotApi.query({
        message: message.trim(),
        ...(sessionId ? { sessionId } : {}),
      }),
    onSuccess: async (response) => {
      setMessage('');
      setSessionId(response.sessionId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['chatbot', 'sessions'] }),
        queryClient.invalidateQueries({ queryKey: ['chatbot', 'messages', response.sessionId] }),
      ]);
    },
  });

  const activeSession = useMemo(
    () => sessionsQuery.data?.find((item) => item.id === sessionId) ?? null,
    [sessionId, sessionsQuery.data],
  );

  return (
    <Screen>
      <TopHero
        eyebrow="Dịch vụ campus"
        title="AI Chatbot"
        subtitle="Trợ lý nội bộ dùng dữ liệu thật của app, không gọi AI ngoài."
        showBrand
        variant="accent"
      />

      <ContentStack overlapHero={false}>
        <SectionCard title="Chat nội bộ" subtitle="Hỏi đáp theo quyền tài khoản hiện tại." variant="highlight" tone="academic">
          <View style={styles.stack}>
            <FormField
              label="Câu hỏi"
              value={message}
              onChangeText={setMessage}
              placeholder='Ví dụ: "Đơn canteen của tôi", "Sách tôi đang mượn", "SOS gần đây"...'
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <PrimaryButton
              label="Gửi câu hỏi"
              loading={queryMutation.isPending}
              disabled={!message.trim()}
              onPress={() => queryMutation.mutate()}
            />
            {queryMutation.isError ? (
              <Text style={[styles.errorText, { color: theme.colors.danger, fontFamily: theme.fonts.medium }]}>
                {(queryMutation.error as Error)?.message ?? 'Không gửi được câu hỏi.'}
              </Text>
            ) : null}
            {queryMutation.data ? (
              <View
                style={[
                  styles.answerCard,
                  {
                    backgroundColor: theme.colors.surfaceSubtle,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.rowBetween}>
                  <StatusBadge label={`Intent: ${queryMutation.data.intent}`} tone="info" size="sm" />
                  <StatusBadge
                    label={`Confidence ${(queryMutation.data.confidence * 100).toFixed(0)}%`}
                    tone={queryMutation.data.confidence >= 0.7 ? 'success' : 'warning'}
                    size="sm"
                  />
                </View>
                <Text style={[styles.answerText, { color: theme.colors.text, fontFamily: theme.fonts.regular }]}>
                  {queryMutation.data.answer}
                </Text>
                {queryMutation.data.deepLinks?.length ? (
                  <View style={styles.linkRow}>
                    {queryMutation.data.deepLinks.map((link) => (
                      <Pressable
                        key={link}
                        accessibilityRole="button"
                        onPress={() => router.push(link as never)}
                        style={({ pressed }) => [
                          styles.deepLinkChip,
                          {
                            borderColor: theme.colors.border,
                            backgroundColor: theme.colors.surface,
                            opacity: pressed ? 0.84 : 1,
                          },
                        ]}
                      >
                        <Text style={[styles.deepLinkText, { color: theme.colors.primary, fontFamily: theme.fonts.medium }]}>
                          {link}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        </SectionCard>

        <SectionCard title="Phiên chat" subtitle="Lịch sử trao đổi theo tài khoản." variant="glass" tone="campus">
          {sessionsQuery.isLoading ? (
            <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
              Đang tải phiên chat...
            </Text>
          ) : (sessionsQuery.data?.length ?? 0) === 0 ? (
            <EmptyState icon="chatbubble-outline" title="Chưa có phiên chat" description="Phiên mới được tạo sau câu hỏi đầu tiên." />
          ) : (
            <View style={styles.stack}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sessionRow}>
                {sessionsQuery.data?.map((session) => (
                  <Pressable
                    key={session.id}
                    accessibilityRole="button"
                    onPress={() => setSessionId(session.id)}
                    style={({ pressed }) => [
                      styles.sessionChip,
                      {
                        borderColor: sessionId === session.id ? theme.colors.primary : theme.colors.border,
                        backgroundColor: sessionId === session.id ? theme.colors.primarySurface : theme.colors.surfaceSubtle,
                        opacity: pressed ? 0.84 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.sessionText, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>
                      {session.title}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              {activeSession ? (
                <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                  Phiên hiện tại: {activeSession.title}
                </Text>
              ) : null}
            </View>
          )}
        </SectionCard>

        <SectionCard title="Lịch sử tin nhắn" subtitle="Nội dung trong phiên đang chọn." variant="outlined">
          {!sessionId ? (
            <EmptyState icon="chatbox-ellipses-outline" title="Chưa chọn phiên chat" description="Chọn một phiên để xem lịch sử." />
          ) : messagesQuery.isLoading ? (
            <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
              Đang tải tin nhắn...
            </Text>
          ) : (messagesQuery.data?.length ?? 0) === 0 ? (
            <EmptyState icon="chatbox-outline" title="Phiên chưa có tin nhắn" description="Tin nhắn sẽ xuất hiện sau khi gửi câu hỏi." />
          ) : (
            <View style={styles.stack}>
              {messagesQuery.data?.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.messageCard,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: item.role === 'assistant' ? theme.colors.primarySurface : theme.colors.surfaceSubtle,
                    },
                  ]}
                >
                  <Text style={[styles.roleText, { color: theme.colors.primary, fontFamily: theme.fonts.semibold }]}>
                    {item.role === 'assistant' ? 'Trợ lý' : 'Bạn'}
                  </Text>
                  <Text style={[styles.answerText, { color: theme.colors.text, fontFamily: theme.fonts.regular }]}>
                    {item.content}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </SectionCard>

        <PrimaryButton label="Quay lại dịch vụ" onPress={() => router.replace('/services')} />
      </ContentStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 18,
  },
  answerCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  answerText: {
    fontSize: 13,
    lineHeight: 19,
  },
  linkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  deepLinkChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  deepLinkText: {
    fontSize: 12,
  },
  sessionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  sessionChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 260,
  },
  sessionText: {
    fontSize: 12,
  },
  messageCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  roleText: {
    fontSize: 12,
  },
});
