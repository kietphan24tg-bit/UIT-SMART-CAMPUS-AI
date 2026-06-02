import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
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

import { Screen, SectionCard, TopHero } from '@/components/ui';
import {
  buildChatbotActionsFromDeepLinks,
  chatbotApi,
  type ChatbotAction,
  type ChatbotAnswerResponse,
  type ChatbotCapabilityScope,
  type ChatbotCitation,
} from '@/services/api/chatbot';
import { useAuthStore } from '@/stores/auth-store';
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
  domain?: string;
  answerType?: string;
  actions?: ChatbotAction[];
  citations?: ChatbotCitation[];
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
function getDefaultSummaryScope(role?: string | null): 'today' | 'work' | 'ops' {
  if (role === 'admin' || role === 'super_admin' || role === 'canteen_admin') {
    return 'ops';
  }
  return 'today';
}

function normalizeActions(
  actions: ChatbotAction[] | undefined,
  deepLinks: string[] | unknown,
): ChatbotAction[] | undefined {
  const normalized = actions?.filter((item) => item?.route && item?.label) ?? [];
  if (normalized.length > 0) {
    return normalized;
  }

  const legacy = buildChatbotActionsFromDeepLinks(deepLinks);
  return legacy.length > 0 ? legacy : undefined;
}

function normalizeCitations(value: ChatbotCitation[] | unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const citations = value.filter(
    (item): item is ChatbotCitation =>
      typeof item === 'object' &&
      item != null &&
      'label' in item &&
      typeof item.label === 'string',
  );
  return citations.length > 0 ? citations : undefined;
}

export default function ChatbotScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);

  const [message, setMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [summaryScope, setSummaryScope] = useState<'today' | 'work' | 'ops'>(
    getDefaultSummaryScope(role),
  );

  const listRef = useRef<FlatList<DisplayMessage>>(null);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const capabilitiesQuery = useQuery({
    queryKey: ['chatbot-capabilities'],
    queryFn: chatbotApi.getCapabilities,
  });

  const summaryQuery = useQuery({
    queryKey: ['chatbot-summary', summaryScope],
    queryFn: () => chatbotApi.getSummary(summaryScope),
  });

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
        domain: response.domain,
        answerType: response.answerType,
        actions: normalizeActions(response.actions, response.deepLinks),
        citations: normalizeCitations(response.citations),
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

  const summaryScopes =
    capabilitiesQuery.data?.summaryScopes ??
    ([] as ChatbotCapabilityScope[]);
  const summaryAnswer = summaryQuery.data;
  const summaryActions = normalizeActions(summaryAnswer?.actions, summaryAnswer?.deepLinks);
  const summaryCitations = normalizeCitations(summaryAnswer?.citations);
  const quickPrompts = capabilitiesQuery.data?.quickPrompts ?? INITIAL_SUGGESTIONS;
  const lastSuggestions =
    messages.length === 0
      ? quickPrompts
      : (messages.findLast((m) => m.role === 'assistant')?.suggestedQuestions ?? []);
  const hasSuggestions = lastSuggestions.length > 0 && !queryMutation.isPending;

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const renderActionChips = useCallback(
    (actions: ChatbotAction[] | undefined) => {
      if (!actions?.length) {
        return null;
      }

      return (
        <View style={styles.linkRow}>
          {actions.map((action) => (
            <Pressable
              key={`${action.route}-${action.label}`}
              onPress={() => router.push(action.route as never)}
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
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      );
    },
    [router, theme],
  );

  const renderCitationChips = useCallback(
    (citations: ChatbotCitation[] | undefined) => {
      if (!citations?.length) {
        return null;
      }

      return (
        <View style={styles.citationRow}>
          {citations.slice(0, 4).map((citation) => (
            <View
              key={`${citation.type}-${citation.sourceId}-${citation.label}`}
              style={[
                styles.citationChip,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.citationText,
                  { color: theme.colors.textMuted, fontFamily: theme.fonts.medium },
                ]}
              >
                {citation.label}
              </Text>
            </View>
          ))}
        </View>
      );
    },
    [theme],
  );

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

            {!isUser && renderActionChips(item.actions)}
            {!isUser && renderCitationChips(item.citations)}

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
    [theme, renderActionChips, renderCitationChips],
  );

  const renderSummaryPanel = useCallback(() => {
    return (
      <View style={styles.headerStack}>
        <SectionCard
          title="Tóm tắt nhanh"
          subtitle="Lấy snapshot theo role trước khi bạn bắt đầu đặt câu hỏi."
        >
          <View style={styles.scopeRow}>
            {summaryScopes.map((item) => (
              <Pressable
                key={item.scope}
                onPress={() => setSummaryScope(item.scope)}
                style={({ pressed }) => [
                  styles.scopeChip,
                  {
                    borderColor:
                      summaryScope === item.scope ? theme.colors.primary : theme.colors.border,
                    backgroundColor:
                      summaryScope === item.scope
                        ? theme.colors.primarySurface
                        : theme.colors.surface,
                    opacity: pressed ? 0.78 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.scopeText,
                    {
                      color:
                        summaryScope === item.scope ? theme.colors.primary : theme.colors.text,
                      fontFamily: theme.fonts.medium,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {summaryQuery.isLoading ? (
            <Text
              style={[
                styles.summaryBody,
                { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
              ]}
            >
              Đang chuẩn bị tóm tắt cho bạn...
            </Text>
          ) : (
            <>
              <Text
                style={[
                  styles.summaryBody,
                  { color: theme.colors.text, fontFamily: theme.fonts.regular },
                ]}
              >
                {summaryAnswer?.answer ??
                  'Bạn có thể chọn một scope ở trên để lấy tóm tắt nhanh.'}
              </Text>
              {renderActionChips(summaryActions)}
              {renderCitationChips(summaryCitations)}
            </>
          )}
        </SectionCard>

        <SectionCard
          title="Gợi ý nhanh"
          subtitle="Các prompt ngắn theo role để bạn bắt đầu nhanh hơn."
        >
          <View style={styles.quickPromptRow}>
            {quickPrompts.slice(0, 6).map((prompt) => (
              <Pressable
                key={prompt}
                onPress={() => send(prompt)}
                style={({ pressed }) => [
                  styles.quickPromptChip,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                    opacity: pressed ? 0.78 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.quickPromptText,
                    { color: theme.colors.primary, fontFamily: theme.fonts.medium },
                  ]}
                >
                  {prompt}
                </Text>
              </Pressable>
            ))}
          </View>
        </SectionCard>
      </View>
    );
  }, [
    quickPrompts,
    renderActionChips,
    renderCitationChips,
    send,
    summaryActions,
    summaryAnswer?.answer,
    summaryCitations,
    summaryQuery.isLoading,
    summaryScope,
    summaryScopes,
    theme,
  ]);

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
          ListHeaderComponent={renderSummaryPanel}
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
  headerStack: {
    gap: 12,
    marginBottom: 12,
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
  citationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  citationChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  citationText: {
    fontSize: 10,
  },
  metaText: {
    fontSize: 10,
    lineHeight: 14,
  },
  scopeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scopeChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  scopeText: {
    fontSize: 12,
  },
  summaryBody: {
    fontSize: 13,
    lineHeight: 20,
  },
  quickPromptRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickPromptChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickPromptText: {
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
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
