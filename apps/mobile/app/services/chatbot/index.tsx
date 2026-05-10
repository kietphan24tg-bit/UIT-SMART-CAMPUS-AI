import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen, TopHero } from '@/components/ui';
import { chatbotApi } from '@/services/api/chatbot';
import { useAppTheme } from '@/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  intent?: string | null;
  confidence?: number | null;
  deepLinks?: unknown;
  suggestedQuestions?: string[];
  createdAt: string;
}

const INITIAL_SUGGESTIONS = [
  'Đơn canteen của tôi',
  'Sách tôi đang mượn',
  'Lịch học hôm nay',
  'Sự kiện sắp tới',
  'Thông báo chưa đọc',
  'SOS gần đây',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ChatbotScreen() {
  const theme = useAppTheme();
  const router = useRouter();

  const [message, setMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);

  const listRef = useRef<FlatList<DisplayMessage>>(null);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const queryMutation = useMutation({
    mutationFn: (text: string) =>
      chatbotApi.query({ message: text.trim(), ...(sessionId ? { sessionId } : {}) }),
    onSuccess: (response, sentMessage) => {
      const now = new Date().toISOString();
      const userMsg: DisplayMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: sentMessage,
        createdAt: now,
      };
      const botMsg: DisplayMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        intent: response.intent,
        confidence: response.confidence,
        deepLinks: response.deepLinks,
        suggestedQuestions: response.suggestedQuestions,
        createdAt: now,
      };
      setMessages((prev) => [...prev, userMsg, botMsg]);
      setSessionId(response.sessionId);
      setMessage('');
      scrollToEnd();
    },
  });

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || queryMutation.isPending) return;
      queryMutation.mutate(trimmed);
    },
    [queryMutation],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(undefined);
    setMessage('');
  }, []);

  const lastSuggestions =
    messages.length === 0
      ? INITIAL_SUGGESTIONS
      : (messages.findLast((m) => m.role === 'assistant')?.suggestedQuestions ?? []);
  const hasSuggestions = lastSuggestions.length > 0 && !queryMutation.isPending;

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const renderMessage = useCallback(
    ({ item }: { item: DisplayMessage }) => {
      const isUser = item.role === 'user';
      return (
        <View style={[styles.bubbleRow, isUser ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
          {!isUser && (
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="sparkles" size={12} color="#fff" />
            </View>
          )}
          <View
            style={[
              styles.bubble,
              isUser
                ? { backgroundColor: theme.colors.primary }
                : {
                    backgroundColor: theme.colors.surfaceSubtle,
                    borderColor: theme.colors.border,
                    borderWidth: 1,
                  },
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                {
                  color: isUser ? '#fff' : theme.colors.text,
                  fontFamily: theme.fonts.regular,
                },
              ]}
            >
              {item.content}
            </Text>

            {!isUser &&
              item.deepLinks &&
              Array.isArray(item.deepLinks) &&
              (item.deepLinks as string[]).length > 0 && (
                <View style={styles.linkRow}>
                  {(item.deepLinks as string[]).map((link) => (
                    <Pressable
                      key={link}
                      onPress={() => router.push(link as never)}
                      style={({ pressed }) => [
                        styles.linkChip,
                        { borderColor: theme.colors.primary, opacity: pressed ? 0.75 : 1 },
                      ]}
                    >
                      <Ionicons
                        name="arrow-forward-circle-outline"
                        size={12}
                        color={theme.colors.primary}
                      />
                      <Text
                        style={[
                          styles.linkText,
                          { color: theme.colors.primary, fontFamily: theme.fonts.medium },
                        ]}
                      >
                        {link}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

            {!isUser && item.confidence != null && (
              <Text
                style={[
                  styles.metaText,
                  { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
                ]}
              >
                {(item.confidence * 100).toFixed(0)}% độ tin cậy
              </Text>
            )}
          </View>
        </View>
      );
    },
    [theme, router],
  );

  // ---------------------------------------------------------------------------
  // Layout
  // ---------------------------------------------------------------------------
  return (
    <Screen scroll={false}>
      <TopHero
        eyebrow="Dịch vụ campus"
        title="AI Chatbot"
        subtitle="Trợ lý nội bộ dùng dữ liệu thật của app."
        showBrand
        variant="accent"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        {/* Message list */}
        <FlatList
          ref={listRef}
          style={styles.messageListViewport}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={scrollToEnd}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={40} color={theme.colors.textMuted} />
              <Text
                style={[
                  styles.emptyTitle,
                  { color: theme.colors.text, fontFamily: theme.fonts.semibold },
                ]}
              >
                Xin chào! Mình có thể giúp gì?
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
                ]}
              >
                Hỏi về lịch học, đặt phòng, canteen, thư viện và nhiều hơn nữa.
              </Text>
            </View>
          }
        />

        <View
          style={[
            styles.composer,
            { borderTopColor: theme.colors.border, backgroundColor: theme.colors.surface },
          ]}
        >
          {/* Suggested questions */}
          {hasSuggestions && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.suggestStrip}
              contentContainerStyle={styles.suggestContent}
            >
              {lastSuggestions.map((q) => (
                <Pressable
                  key={q}
                  onPress={() => send(q)}
                  style={({ pressed }) => [
                    styles.suggestChip,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.suggestText,
                      { color: theme.colors.primary, fontFamily: theme.fonts.medium },
                    ]}
                  >
                    {q}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {/* Input bar */}
          <View style={styles.inputBar}>
            {messages.length > 0 && (
              <Pressable
                onPress={clearChat}
                accessibilityRole="button"
                accessibilityLabel="Xóa cuộc trò chuyện"
                style={({ pressed }) => [
                  styles.clearBtn,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surfaceSubtle,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Ionicons name="trash-outline" size={18} color={theme.colors.textMuted} />
              </Pressable>
            )}
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Nhập câu hỏi..."
              placeholderTextColor={theme.colors.textMuted}
              style={[
                styles.textInput,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surfaceSubtle,
                  fontFamily: theme.fonts.regular,
                  borderColor: theme.colors.border,
                },
              ]}
              multiline
              maxLength={500}
              onSubmitEditing={() => send(message)}
              returnKeyType="send"
              blurOnSubmit
            />
            <Pressable
              onPress={() => send(message)}
              disabled={!message.trim() || queryMutation.isPending}
              accessibilityRole="button"
              accessibilityLabel="Gửi câu hỏi"
              style={({ pressed }) => [
                styles.sendBtn,
                {
                  backgroundColor:
                    message.trim() && !queryMutation.isPending
                      ? theme.colors.primary
                      : theme.colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              {queryMutation.isPending ? (
                <Ionicons name="ellipsis-horizontal" size={18} color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  messageListViewport: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    flexGrow: 1,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  bubbleRowLeft: {
    justifyContent: 'flex-start',
  },
  bubbleRowRight: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  linkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  linkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  linkText: {
    fontSize: 11,
  },
  metaText: {
    fontSize: 10,
    lineHeight: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  composer: {
    borderTopWidth: 1,
  },
  suggestStrip: {
    maxHeight: 56,
  },
  suggestContent: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  suggestChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  suggestText: {
    fontSize: 12,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingVertical: 10,
  },
  clearBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
