import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ContentStack,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionCard,
  StatusBadge,
  TopHero,
} from '@/components/ui';
import {
  UIT_MEMORY_GAME_PAIRS,
  getUitMemoryRoundOptions,
  type UitMemoryGamePair,
} from '@/constants/uit-memory-game';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAppTheme } from '@/theme';

function resolveResultCopy(score: number, total: number) {
  if (score === total) {
    return 'Bạn ghép đúng toàn bộ hành trình xưa và nay của UIT.';
  }

  if (score >= total - 1) {
    return 'Bạn đã nắm rất rõ những góc nhìn chuyển mình của campus UIT.';
  }

  if (score >= Math.ceil(total / 2)) {
    return 'Bạn đã bắt được nhịp câu chuyện campus, thử lại để ghép trọn vẹn hơn.';
  }

  return 'Thử lại một lượt nữa để nhìn rõ hơn hành trình thay đổi của UIT.';
}

export default function UitMemoryGameScreen() {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const router = useRouter();
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [revealedCorrectIds, setRevealedCorrectIds] = useState<number[]>([]);

  const totalRounds = UIT_MEMORY_GAME_PAIRS.length;
  const isFinished = roundIndex >= totalRounds;
  const currentPair = isFinished ? null : UIT_MEMORY_GAME_PAIRS[roundIndex];
  const options = useMemo(
    () => (isFinished ? [] : getUitMemoryRoundOptions()),
    [isFinished],
  );
  const optionRows = useMemo(
    () => (isFinished ? [] : [options.slice(0, 2), options.slice(2, 4)]),
    [isFinished, options],
  );
  const isAnswered = selectedOptionId != null;
  const isCorrectSelection =
    currentPair != null && selectedOptionId != null ? selectedOptionId === currentPair.id : false;

  const handleSelectOption = (optionId: number) => {
    if (!currentPair || isAnswered) {
      return;
    }

    setSelectedOptionId(optionId);
    if (optionId === currentPair.id) {
      setScore((value) => value + 1);
    }
  };

  const handleAdvanceRound = () => {
    if (!currentPair) {
      return;
    }

    setRevealedCorrectIds((value) =>
      value.includes(currentPair.id) ? value : [...value, currentPair.id],
    );
    setRoundIndex((value) => value + 1);
    setSelectedOptionId(null);
  };

  const handleRestartGame = () => {
    setRoundIndex(0);
    setScore(0);
    setSelectedOptionId(null);
    setRevealedCorrectIds([]);
  };

  return (
    <Screen>
      <TopHero
        eyebrow="UIT 20 năm"
        title="Ghép ảnh UIT xưa và nay"
        subtitle="Chọn bức ảnh hiện tại khớp với ảnh tư liệu để nối lại hành trình chuyển mình của campus."
        badge={{
          label: isFinished ? 'Hoàn thành' : `Lượt ${roundIndex + 1}/${totalRounds}`,
          tone: 'info',
        }}
        variant="accent"
      />

      <ContentStack gap={16} overlapHero={false}>
        {!isFinished && currentPair ? (
          <>
            <SectionCard
              title="Ảnh tư liệu"
              subtitle={currentPair.prompt}
              variant="highlight"
              tone="academic"
              headerAccessory={
                <StatusBadge label={`Điểm ${score}/${totalRounds}`} tone="success" size="sm" />
              }
            >
              <View style={styles.imageColumn}>
                <Image
                  source={currentPair.pastImage}
                  style={[
                    styles.heroImage,
                    {
                      borderRadius: theme.radii.lg,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  contentFit="cover"
                />
                <View style={styles.legendRow}>
                  <LegendChip
                    icon="time-outline"
                    label="Ảnh quá khứ"
                    color={theme.colors.primary}
                    surface={theme.colors.primarySurface}
                  />
                  <LegendChip
                    icon="images-outline"
                    label="Chọn ảnh hiện tại"
                    color={theme.colors.accentTelemetry}
                    surface={theme.colors.accentTelemetrySurface}
                  />
                </View>
              </View>
            </SectionCard>

            <SectionCard
              title="Chọn cặp đúng"
              subtitle="Mỗi lượt chỉ có một ảnh hiện tại khớp với khung cảnh tư liệu."
              variant="elevated"
              tone="campus"
            >
              <View style={styles.optionsGrid}>
                {optionRows.map((row, rowIndex) => (
                  <View
                    key={`option-row-${rowIndex + 1}`}
                    testID={`uit-memory-option-row-${rowIndex + 1}`}
                    style={styles.optionsRow}
                  >
                    {row.map((option) => (
                      <MemoryOptionCard
                        key={option.id}
                        option={option}
                        isAnswered={isAnswered}
                        isCorrect={currentPair.id === option.id && isAnswered}
                        isWrongSelection={
                          isAnswered &&
                          selectedOptionId === option.id &&
                          option.id !== currentPair.id
                        }
                        onPress={handleSelectOption}
                      />
                    ))}
                    {row.length < 2 ? <View style={styles.optionCardSpacer} /> : null}
                  </View>
                ))}
              </View>
            </SectionCard>

            {isAnswered ? (
              <SectionCard
                title={isCorrectSelection ? 'Ghép đúng rồi' : 'Cặp đúng là đây'}
                subtitle={
                  isCorrectSelection
                    ? 'Bạn đã nối đúng góc nhìn quá khứ với hiện tại.'
                    : 'Bạn vẫn có thể xem lại cặp ảnh đúng trước khi sang lượt tiếp theo.'
                }
                variant="subtle"
                tone={isCorrectSelection ? 'success' : 'warning'}
              >
                <View style={[styles.revealRow, layout.isCompact ? styles.revealRowCompact : null]}>
                  <ComparisonImageCard
                    title="Quá khứ"
                    imageSource={currentPair.pastImage}
                    toneColor={theme.colors.primary}
                  />
                  <ComparisonImageCard
                    title="Hiện tại"
                    imageSource={currentPair.currentImage}
                    toneColor={theme.colors.accentTelemetry}
                  />
                </View>
                <View style={styles.revealActions}>
                  <PrimaryButton
                    label={roundIndex === totalRounds - 1 ? 'Xem kết quả' : 'Lượt tiếp theo'}
                    onPress={handleAdvanceRound}
                  />
                </View>
              </SectionCard>
            ) : null}
          </>
        ) : (
          <>
            <SectionCard
              title={`Bạn đạt ${score}/${totalRounds}`}
              subtitle={resolveResultCopy(score, totalRounds)}
              variant="highlight"
              tone="academic"
            >
              <View style={styles.summaryStack}>
                <View style={styles.summaryBadges}>
                  <StatusBadge label="UIT xưa" tone="info" />
                  <StatusBadge label="UIT nay" tone="success" />
                  <StatusBadge label="Kết nối ký ức" tone="warning" />
                </View>
                <Text
                  style={[
                    styles.summaryText,
                    { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
                  ]}
                >
                  {score === totalRounds
                    ? 'Bạn đã ghép trọn vẹn cả bốn cặp ảnh kỷ niệm.'
                    : 'Bạn có thể chơi lại để thử ghép đủ cả bốn cặp ảnh.'}
                </Text>
              </View>
            </SectionCard>

            <SectionCard
              title="Bốn cặp ảnh UIT xưa và nay"
              subtitle="Xem lại toàn bộ hành trình biến đổi của các góc campus trong bộ ảnh."
              variant="elevated"
              tone="campus"
            >
              <View style={styles.galleryStack}>
                {UIT_MEMORY_GAME_PAIRS.map((pair) => (
                  <View
                    key={pair.id}
                    style={[
                      styles.galleryCard,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                        borderRadius: theme.radii.lg,
                      },
                    ]}
                  >
                    <View style={styles.galleryHeader}>
                      <Text
                        style={[
                          styles.galleryTitle,
                          { color: theme.colors.text, fontFamily: theme.fonts.semibold },
                        ]}
                      >
                        {pair.title}
                      </Text>
                      <StatusBadge
                        label={revealedCorrectIds.includes(pair.id) ? 'Đã chơi' : 'Tư liệu'}
                        tone={revealedCorrectIds.includes(pair.id) ? 'success' : 'info'}
                        size="sm"
                      />
                    </View>
                    <View style={[styles.revealRow, layout.isCompact ? styles.revealRowCompact : null]}>
                      <ComparisonImageCard
                        title="Xưa"
                        imageSource={pair.pastImage}
                        toneColor={theme.colors.primary}
                      />
                      <ComparisonImageCard
                        title="Nay"
                        imageSource={pair.currentImage}
                        toneColor={theme.colors.accentTelemetry}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </SectionCard>

            <View style={styles.finishActions}>
              <PrimaryButton label="Chơi lại" onPress={handleRestartGame} />
              <SecondaryButton label="Về trang chủ" onPress={() => router.back()} />
            </View>
          </>
        )}
      </ContentStack>
    </Screen>
  );
}

function LegendChip({
  icon,
  label,
  color,
  surface,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  surface: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={[styles.legendChip, { backgroundColor: surface }]}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.legendChipLabel, { color, fontFamily: theme.fonts.semibold }]}>
        {label}
      </Text>
    </View>
  );
}

function MemoryOptionCard({
  option,
  isAnswered,
  isCorrect,
  isWrongSelection,
  onPress,
}: {
  option: UitMemoryGamePair;
  isAnswered: boolean;
  isCorrect: boolean;
  isWrongSelection: boolean;
  onPress: (optionId: number) => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      testID={`uit-memory-option-${option.id}`}
      accessibilityRole="button"
      accessibilityLabel={`Chọn ảnh hiện tại ${option.id}`}
      disabled={isAnswered}
      onPress={() => onPress(option.id)}
      style={({ pressed }) => [
        styles.optionCard,
        styles.optionCardCell,
        {
          backgroundColor: theme.colors.surface,
          borderColor: isCorrect
            ? theme.colors.success
            : isWrongSelection
              ? theme.colors.danger
              : theme.colors.border,
          opacity: pressed && !isAnswered ? 0.92 : 1,
        },
        theme.elevation.level1 as never,
      ]}
    >
      <Image
        source={option.currentImage}
        style={[
          styles.optionImage,
          {
            borderRadius: theme.radii.md,
          },
        ]}
        contentFit="cover"
      />
      <View style={styles.optionFooter}>
        <Text
          style={[styles.optionLabel, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}
        >
          Lựa chọn {option.id}
        </Text>
        {isCorrect ? (
          <StatusBadge label="Đúng cặp" tone="success" size="sm" />
        ) : isWrongSelection ? (
          <StatusBadge label="Chưa khớp" tone="danger" size="sm" />
        ) : null}
      </View>
    </Pressable>
  );
}

function ComparisonImageCard({
  title,
  imageSource,
  toneColor,
}: {
  title: string;
  imageSource: number;
  toneColor: string;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.comparisonCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.lg,
        },
      ]}
    >
      <Image source={imageSource} style={styles.comparisonImage} contentFit="cover" />
      <View style={styles.comparisonFooter}>
        <View style={[styles.comparisonAccent, { backgroundColor: toneColor }]} />
        <Text
          style={[styles.comparisonTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageColumn: {
    gap: 12,
  },
  heroImage: {
    aspectRatio: 16 / 10,
    borderWidth: 1,
    width: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendChip: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    minHeight: 32,
    paddingHorizontal: 12,
  },
  legendChipLabel: {
    fontSize: 12,
  },
  optionsGrid: {
    gap: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionCard: {
    borderWidth: 1,
    padding: 10,
  },
  optionCardCell: {
    flex: 1,
    minWidth: 0,
  },
  optionCardSpacer: {
    flex: 1,
  },
  optionImage: {
    aspectRatio: 16 / 10,
    width: '100%',
  },
  optionFooter: {
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 10,
  },
  optionLabel: {
    fontSize: 14,
  },
  revealRow: {
    flexDirection: 'row',
    gap: 12,
  },
  revealRowCompact: {
    flexDirection: 'column',
  },
  comparisonCard: {
    borderWidth: 1,
    flex: 1,
    overflow: 'hidden',
  },
  comparisonImage: {
    aspectRatio: 16 / 10,
    width: '100%',
  },
  comparisonFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  comparisonAccent: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  comparisonTitle: {
    fontSize: 14,
  },
  revealActions: {
    marginTop: 14,
  },
  summaryStack: {
    gap: 12,
  },
  summaryBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  galleryStack: {
    gap: 12,
  },
  galleryCard: {
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  galleryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  galleryTitle: {
    flex: 1,
    fontSize: 15,
  },
  finishActions: {
    gap: 12,
  },
});
