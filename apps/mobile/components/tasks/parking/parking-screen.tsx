import { Ionicons } from '@expo/vector-icons';
import type { ParkingSlotState } from '@smart-campus/shared';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  ContentStack,
  EmptyState,
  Screen,
  SectionCard,
  TopHero,
} from '@/components/ui';
import { useParkingOverview } from '@/hooks/use-parking-overview';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAppTheme } from '@/theme';
import { getTelemetryHealthLabel } from '@/utils/app';

export default function ParkingScreen() {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const parking = useParkingOverview();

  const parkingStatus = parking.data?.status ?? null;
  const slots = parkingStatus?.slots ?? [];
  const boardSlots = getBoardSlots(slots);
  const gatewayState = parking.data?.telemetryHealth ?? 'offline';
  const gatewayLabel = getTelemetryHealthLabel(gatewayState);
  const gatewayTone =
    gatewayState === 'fire-alert'
      ? 'danger'
      : gatewayState === 'offline' || gatewayState === 'stale'
        ? 'warning'
        : gatewayState === 'no-data'
          ? 'info'
          : 'success';
  const shouldShowGatewayCallout = gatewayState !== 'online' && gatewayState !== 'no-data';
  const cardGap = layout.isCompact ? 10 : 12;
  const climateState = getClimateState(
    parkingStatus?.sensors.temperature ?? null,
    parkingStatus?.sensors.humidity ?? null,
  );

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={parking.isRefetching}
          onRefresh={() => void parking.refetch()}
          tintColor={theme.colors.primary}
        />
      }
    >
      <TopHero
        eyebrow="Parking + IoT"
        title="Bãi xe UIT"
        subtitle="Slot và cảm biến."
        badge={{ label: gatewayLabel, tone: gatewayTone }}
      />

      <ContentStack>
        {shouldShowGatewayCallout ? (
          <View
            style={[
              styles.gatewayCallout,
              {
                backgroundColor:
                  gatewayTone === 'danger'
                    ? theme.colors.emergencySurface
                    : gatewayTone === 'warning'
                      ? theme.colors.warningSurface
                      : theme.colors.infoSurface,
                borderColor:
                  gatewayTone === 'danger'
                    ? theme.colors.emergency
                    : gatewayTone === 'warning'
                      ? theme.colors.warning
                      : theme.colors.info,
              },
            ]}
          >
            <Ionicons
              name={gatewayTone === 'danger' ? 'flame-outline' : 'cloud-offline-outline'}
              size={18}
              color={
                gatewayTone === 'danger'
                  ? theme.colors.emergency
                  : gatewayTone === 'warning'
                    ? theme.colors.warning
                    : theme.colors.info
              }
            />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.calloutTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                Dữ liệu {gatewayLabel.toLowerCase()}
              </Text>
              <Text style={[styles.calloutBody, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                {gatewayState === 'fire-alert'
                  ? 'Ưu tiên xử lý cảnh báo cháy.'
                  : gatewayState === 'offline'
                    ? 'Hiển thị dữ liệu gần nhất.'
                    : 'Kéo xuống để làm mới.'}
              </Text>
            </View>
          </View>
        ) : null}

        <SectionCard title="Cảm biến" subtitle="Theo phần cứng đang có." variant="glass" tone="neutral">
          {parkingStatus ? (
            <View style={styles.sectionStack}>
              <View style={[styles.sensorRow, { gap: cardGap }]}>
                <SensorStatusCard
                  label="Chỗ trống"
                  value={`${parkingStatus.availableSlots}/${parkingStatus.totalSlots}`}
                  caption="IR A1-A2"
                  advisory="2 cảm biến hồng ngoại"
                  icon="scan-outline"
                  tone="infrared"
                  motion="slot"
                  active
                />
                <SensorStatusCard
                  label="Mưa"
                  value={parkingStatus.sensors.rainDetected ? 'Có mưa' : 'Không mưa'}
                  caption="Cảm biến mưa"
                  advisory={parkingStatus.sensors.rainDetected ? 'Mang dù' : 'Khô ráo'}
                  icon={parkingStatus.sensors.rainDetected ? 'rainy-outline' : 'partly-sunny-outline'}
                  tone="rain"
                  motion={parkingStatus.sensors.rainDetected ? 'rain' : 'calm'}
                  active
                />
              </View>
              <View style={[styles.sensorRow, { gap: cardGap }]}>
                <SensorStatusCard
                  label="Nhiệt ẩm"
                  value={climateState.value}
                  caption={climateState.caption}
                  advisory={climateState.advisory}
                  icon={climateState.icon}
                  tone={climateState.tone}
                  motion={climateState.motion}
                  active={climateState.active}
                />
                <SensorStatusCard
                  label="Cháy"
                  value={parkingStatus.sensors.fireDetected ? 'Có cháy' : 'Không cháy'}
                  caption="Cảm biến cháy"
                  advisory={parkingStatus.sensors.fireDetected ? 'Sơ tán' : 'An toàn'}
                  icon={parkingStatus.sensors.fireDetected ? 'flame-outline' : 'shield-checkmark-outline'}
                  tone="fire"
                  motion={parkingStatus.sensors.fireDetected ? 'fire' : 'calm'}
                  active
                />
              </View>
            </View>
          ) : (
            <EmptyState icon="pulse-outline" title="Chưa có telemetry" description="Kéo xuống để làm mới dữ liệu." />
          )}
        </SectionCard>

        <SectionCard title="2 cảm biến hồng ngoại" subtitle="Slot A1-A2." variant="list" tone="academic">
          {parkingStatus ? (
            <View style={styles.sectionStack}>
              <View style={[styles.slotRow, { gap: cardGap }]}>
                {boardSlots.map((slot, index) => (
                  <SlotTile key={slot?.slotNumber ?? `slot-${index}`} slot={slot} />
                ))}
                {boardSlots.length < 2 ? <View style={{ flex: 1 }} /> : null}
              </View>
            </View>
          ) : (
            <EmptyState icon="car-sport-outline" title="Chưa có dữ liệu" description="Sơ đồ sẽ hiện sau khi tải xong." />
          )}
        </SectionCard>

      </ContentStack>
    </Screen>
  );
}

function getBoardSlots(slots: ParkingSlotState[]) {
  const defaultOrder = ['A1', 'A2'];
  const slotByNumber = new Map(slots.map((slot) => [slot.slotNumber, slot]));
  const hasAllDefault = defaultOrder.every((slotNumber) => slotByNumber.has(slotNumber));
  const picked = hasAllDefault
    ? defaultOrder
    : [...slots]
      .slice()
      .sort((a, b) => a.slotNumber.localeCompare(b.slotNumber))
      .slice(0, 2)
      .map((slot) => slot.slotNumber);

  const numbers = picked.length > 0 ? picked : defaultOrder;
  return numbers.map((slotNumber) => slotByNumber.get(slotNumber) ?? null);
}



type SensorTone =
  | 'infrared'
  | 'rain'
  | 'climateWarm'
  | 'climateCool'
  | 'climateAqua'
  | 'fire'
  | 'muted';
type SensorMotion = 'slot' | 'rain' | 'heat' | 'cold' | 'humidity' | 'fire' | 'calm';

function getClimateState(temperature: number | null, humidity: number | null) {
  const hasTemperature = typeof temperature === 'number';
  const hasHumidity = typeof humidity === 'number';
  const value = `${hasTemperature ? `${temperature}°C` : '--°C'} · ${hasHumidity ? `${humidity}%` : '--%'}`;
  const caption = 'Nhiệt độ · Độ ẩm';

  if (!hasTemperature && !hasHumidity) {
    return {
      value,
      caption,
      advisory: 'Chưa có dữ liệu',
      icon: 'thermometer-outline' as keyof typeof Ionicons.glyphMap,
      tone: 'muted' as SensorTone,
      motion: 'calm' as SensorMotion,
      active: false,
    };
  }

  if (hasTemperature && temperature >= 34) {
    return {
      value,
      caption,
      advisory: 'Nóng lên',
      icon: 'sunny-outline' as keyof typeof Ionicons.glyphMap,
      tone: 'climateWarm' as SensorTone,
      motion: 'heat' as SensorMotion,
      active: true,
    };
  }

  if (hasTemperature && temperature <= 22) {
    return {
      value,
      caption,
      advisory: 'Mát lạnh',
      icon: 'snow-outline' as keyof typeof Ionicons.glyphMap,
      tone: 'climateCool' as SensorTone,
      motion: 'cold' as SensorMotion,
      active: true,
    };
  }

  if (hasHumidity && humidity <= 40) {
    return {
      value,
      caption,
      advisory: 'Không khí khô',
      icon: 'water-outline' as keyof typeof Ionicons.glyphMap,
      tone: 'climateAqua' as SensorTone,
      motion: 'humidity' as SensorMotion,
      active: true,
    };
  }

  if (hasHumidity && humidity >= 85) {
    return {
      value,
      caption,
      advisory: 'Ẩm cao',
      icon: 'water-outline' as keyof typeof Ionicons.glyphMap,
      tone: 'climateAqua' as SensorTone,
      motion: 'humidity' as SensorMotion,
      active: true,
    };
  }

  return {
    value,
    caption,
    advisory: 'Êm dịu',
    icon: 'thermometer-outline' as keyof typeof Ionicons.glyphMap,
    tone: 'climateWarm' as SensorTone,
    motion: 'calm' as SensorMotion,
    active: true,
  };
}

function SensorStatusCard({
  label,
  value,
  caption,
  advisory,
  icon,
  tone,
  motion,
  active,
}: {
  label: string;
  value: string;
  caption: string;
  advisory: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: SensorTone;
  motion: SensorMotion;
  active: boolean;
}) {
  const theme = useAppTheme();
  const isTestEnv =
    process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID != null;
  const [reduceMotion, setReduceMotion] = useState(isTestEnv);
  const progress = useRef(new Animated.Value(0)).current;
  const toneStyle = getSensorToneStyle(theme, tone);
  const shouldAnimate = active && !reduceMotion;
  const useNativeDriver = !isTestEnv;

  useEffect(() => {
    if (isTestEnv) {
      return undefined;
    }

    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) {
        setReduceMotion(enabled);
      }
    });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [isTestEnv]);

  useEffect(() => {
    if (!shouldAnimate) {
      progress.stopAnimation();
      progress.setValue(0);
      return undefined;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: motion === 'fire' ? 520 : 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: motion === 'fire' ? 520 : 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [motion, progress, shouldAnimate, useNativeDriver]);

  const iconScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, motion === 'fire' ? 1.12 : motion === 'slot' ? 1.08 : motion === 'calm' ? 1.03 : 1.06],
  });
  const iconTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, motion === 'slot' ? 3 : 0],
  });
  const iconTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [
      0,
      motion === 'rain'
        ? 5
        : motion === 'cold'
          ? -4
          : motion === 'heat' || motion === 'humidity' || motion === 'calm'
            ? -2
            : 0,
    ],
  });
  const haloOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [
      0.12,
      motion === 'fire' ? 0.42 : motion === 'heat' || motion === 'humidity' ? 0.32 : motion === 'calm' ? 0.18 : 0.28,
    ],
  });

  return (
    <View
      style={[
        styles.sensorCard,
        {
          backgroundColor: toneStyle.surface,
          borderColor: toneStyle.border,
          flex: 1,
        },
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.sensorBackdrop,
          {
            backgroundColor: toneStyle.backdrop,
          },
        ]}
      />
      {motion === 'rain' ? (
        <RainParticleLayer
          active={active}
          accentColor={toneStyle.accent}
          dropColor={theme.isDark ? '#7FCBFF' : '#2F97F4'}
          reduceMotion={reduceMotion}
        />
      ) : null}
      <View style={styles.sensorHeader}>
        <View style={[styles.sensorIconWrap, { backgroundColor: toneStyle.iconSurface }]}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.sensorHalo,
              {
                backgroundColor: toneStyle.accent,
                opacity: shouldAnimate ? haloOpacity : 0.12,
              },
            ]}
          />
          <Animated.View
            style={{
              transform: [{ scale: iconScale }, { translateX: iconTranslateX }, { translateY: iconTranslateY }],
            }}
          >
            <Ionicons name={icon} size={22} color={toneStyle.accent} />
          </Animated.View>
        </View>
        <Text style={[styles.sensorAdvisory, { color: toneStyle.accent, fontFamily: theme.fonts.semibold }]}>
          {advisory}
        </Text>
      </View>
      <Text style={[styles.sensorLabel, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>{label}</Text>
      <Text style={[styles.sensorValue, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>{value}</Text>
      <Text style={[styles.sensorCaption, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
        {caption}
      </Text>
    </View>
  );
}

function getSensorToneStyle(theme: ReturnType<typeof useAppTheme>, tone: SensorTone) {
  switch (tone) {
    case 'infrared':
      return {
        surface: theme.isDark ? 'rgba(81, 184, 151, 0.18)' : '#E8F7F1',
        iconSurface: theme.isDark ? 'rgba(247, 255, 252, 0.08)' : '#F8FFFC',
        border: theme.isDark ? '#7CE0BD' : '#59C6A7',
        accent: theme.isDark ? '#9BE9CF' : '#2BA889',
        backdrop: theme.isDark ? 'rgba(81, 184, 151, 0.14)' : 'rgba(130, 220, 187, 0.18)',
      };
    case 'rain':
      return {
        surface: theme.isDark ? 'rgba(111, 145, 226, 0.18)' : '#EEF3FF',
        iconSurface: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : '#FBFCFF',
        border: theme.isDark ? '#A9BEFF' : '#7BA8F8',
        accent: theme.isDark ? '#CDD7FF' : '#5B7CDE',
        backdrop: theme.isDark ? 'rgba(111, 145, 226, 0.16)' : 'rgba(173, 191, 255, 0.2)',
      };
    case 'climateWarm':
      return {
        surface: theme.isDark ? 'rgba(235, 157, 116, 0.18)' : '#FFF1E7',
        iconSurface: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFF9F5',
        border: theme.isDark ? '#FFC8A3' : '#F3AA7C',
        accent: theme.isDark ? '#FFD8BF' : '#E78B57',
        backdrop: theme.isDark ? 'rgba(235, 157, 116, 0.16)' : 'rgba(255, 199, 160, 0.2)',
      };
    case 'climateCool':
      return {
        surface: theme.isDark ? 'rgba(140, 183, 225, 0.18)' : '#EEF6FF',
        iconSurface: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : '#F8FBFF',
        border: theme.isDark ? '#B8D5F5' : '#9CC2F1',
        accent: theme.isDark ? '#D7EBFF' : '#5C8DCD',
        backdrop: theme.isDark ? 'rgba(140, 183, 225, 0.16)' : 'rgba(167, 205, 244, 0.18)',
      };
    case 'climateAqua':
      return {
        surface: theme.isDark ? 'rgba(101, 191, 195, 0.18)' : '#EAF8F8',
        iconSurface: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : '#F8FEFE',
        border: theme.isDark ? '#8EE0D6' : '#6DC5C8',
        accent: theme.isDark ? '#B0F1E6' : '#379DA2',
        backdrop: theme.isDark ? 'rgba(101, 191, 195, 0.15)' : 'rgba(139, 223, 225, 0.18)',
      };
    case 'fire':
      return {
        surface: theme.isDark ? 'rgba(232, 112, 118, 0.18)' : '#FFF0EF',
        iconSurface: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFF9F9',
        border: theme.isDark ? '#FFB2B5' : '#F5A1A3',
        accent: theme.isDark ? '#FFD2D4' : '#E87076',
        backdrop: theme.isDark ? 'rgba(232, 112, 118, 0.15)' : 'rgba(255, 184, 187, 0.18)',
      };
    default:
      return {
        surface: theme.isDark ? 'rgba(148, 163, 184, 0.16)' : '#F4F7FB',
        iconSurface: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : '#FCFEFF',
        border: theme.colors.border,
        accent: theme.isDark ? '#CBD5E1' : '#7B95BF',
        backdrop: theme.isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(201, 216, 238, 0.16)',
      };
  }
}

function SlotTile({ slot }: { slot: ParkingSlotState | null }) {
  const theme = useAppTheme();
  const state = slot ? (slot.isOccupied ? 'occupied' : 'available') : 'unknown';
  const tileStyle = getSlotToneStyle(theme, state);
  const label = state === 'available' ? 'Trống' : state === 'occupied' ? 'Có xe' : 'Chưa có';

  return (
    <View
      style={[
        styles.slotTile,
        {
          backgroundColor: tileStyle.surface,
          borderColor: tileStyle.border,
          flex: 1,
        },
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.slotBackdrop,
          {
            backgroundColor: tileStyle.backdrop,
          },
        ]}
      />
      <Text style={[styles.slotNumber, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
        {slot?.slotNumber ?? '--'}
      </Text>
      <Text style={[styles.slotState, { color: theme.colors.textMuted, fontFamily: theme.fonts.medium }]}>{label}</Text>
      {slot?.vehiclePlate ? (
        <Text style={[styles.slotMeta, { color: theme.colors.textSoft, fontFamily: theme.fonts.regular }]}>
          {slot.vehiclePlate}
        </Text>
      ) : null}
    </View>
  );
}

function getSlotToneStyle(
  theme: ReturnType<typeof useAppTheme>,
  state: 'available' | 'occupied' | 'unknown',
) {
  if (state === 'available') {
    return {
      surface: theme.isDark ? 'rgba(81, 184, 151, 0.18)' : '#E8F7F1',
      border: theme.isDark ? '#7CE0BD' : '#59C6A7',
      backdrop: theme.isDark ? 'rgba(81, 184, 151, 0.14)' : 'rgba(130, 220, 187, 0.18)',
    };
  }

  if (state === 'occupied') {
    return {
      surface: theme.isDark ? 'rgba(143, 134, 185, 0.16)' : '#F1EFFB',
      border: theme.isDark ? '#C9C2EE' : '#B7AFD9',
      backdrop: theme.isDark ? 'rgba(143, 134, 185, 0.12)' : 'rgba(197, 190, 231, 0.18)',
    };
  }

  return {
    surface: theme.isDark ? 'rgba(140, 183, 225, 0.16)' : '#EEF6FF',
    border: theme.isDark ? '#B8D5F5' : '#AFCAE9',
    backdrop: theme.isDark ? 'rgba(140, 183, 225, 0.12)' : 'rgba(167, 205, 244, 0.16)',
  };
}

const RAIN_DROPLETS = [
  { left: '12%', delay: 0, duration: 2740, drift: 2, size: 16 },
  { left: '28%', delay: 280, duration: 2960, drift: 3, size: 18 },
  { left: '44%', delay: 620, duration: 2860, drift: 2, size: 15 },
  { left: '60%', delay: 180, duration: 3040, drift: 4, size: 20 },
  { left: '76%', delay: 520, duration: 2940, drift: 3, size: 17 },
  { left: '88%', delay: 760, duration: 2820, drift: 2, size: 14 },
] as const;

function RainDropGlyph({ accentColor, size }: { accentColor: string; size: number }) {
  return (
    <View style={[styles.rainGlyph, { width: size, height: size * 1.28 }]}>
      <Ionicons name="water" size={size} color={accentColor} />
      <View
        style={[
          styles.rainGlyphHighlight,
          {
            left: size * 0.24,
            top: size * 0.26,
            width: Math.max(size * 0.18, 3),
            height: Math.max(size * 0.26, 4),
          },
        ]}
      />
    </View>
  );
}

function RainParticleLayer({
  active,
  accentColor,
  dropColor,
  reduceMotion,
}: {
  active: boolean;
  accentColor: string;
  dropColor: string;
  reduceMotion: boolean;
}) {
  const particles = useRef(
    RAIN_DROPLETS.map(() => new Animated.Value(0)),
  ).current;
  const isTestEnv =
    process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID != null;
  const useNativeDriver = !isTestEnv;

  useEffect(() => {
    if (!active || reduceMotion || isTestEnv) {
      particles.forEach((particle) => {
        particle.stopAnimation();
        particle.setValue(0);
      });
      return undefined;
    }

    const loops = particles.map((particle, index) => {
      const droplet = RAIN_DROPLETS[index];
      return Animated.loop(
        Animated.sequence([
          Animated.delay(droplet.delay),
          Animated.timing(particle, {
            toValue: 1,
            duration: droplet.duration,
            easing: Easing.linear,
            useNativeDriver,
          }),
          Animated.timing(particle, {
            toValue: 0,
            duration: 0,
            useNativeDriver,
          }),
        ]),
      );
    });

    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [active, isTestEnv, particles, reduceMotion, useNativeDriver]);

  return (
    <View
      pointerEvents="none"
      style={styles.rainLayer}
      testID={active ? 'rain-particles' : undefined}
    >
      {reduceMotion
        ? RAIN_DROPLETS.slice(0, 4).map((droplet, index) => (
          <View
            key={`rain-static-${droplet.left}`}
            style={[
              styles.rainDropWrap,
              {
                left: droplet.left,
                top: 20 + index * 13,
                width: droplet.size,
                height: droplet.size * 1.28,
                opacity: 0.22 + index * 0.04,
              },
            ]}
          >
            <RainDropGlyph accentColor={dropColor} size={droplet.size} />
          </View>
        ))
        : RAIN_DROPLETS.map((droplet, index) => {
          const progress = particles[index];
          const translateY = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [-30, 126],
          });
          const translateX = progress.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, droplet.drift, droplet.drift - 1],
          });
          const opacity = progress.interpolate({
            inputRange: [0, 0.14, 0.84, 1],
            outputRange: [0, 0.56, 0.4, 0],
          });

          return (
            <Animated.View
              key={`rain-drop-${droplet.left}`}
              style={[
                styles.rainDropWrap,
                {
                  left: droplet.left,
                  width: droplet.size,
                  height: droplet.size * 1.28,
                  opacity,
                  transform: [{ translateX }, { translateY }],
                },
              ]}
            >
              <RainDropGlyph accentColor={dropColor} size={droplet.size} />
            </Animated.View>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionStack: {
    gap: 12,
  },
  infoGrid: {
    gap: 8,
  },
  gatewayCallout: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  calloutTitle: {
    fontSize: 14,
  },
  calloutBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sensorGrid: {
    gap: 12,
  },
  sensorRow: {
    flexDirection: 'row',
  },
  sensorCard: {
    minHeight: 142,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    overflow: 'hidden',
  },
  sensorBackdrop: {
    position: 'absolute',
    width: 142,
    height: 142,
    borderRadius: 999,
    right: -34,
    top: -44,
    opacity: 0.72,
  },
  sensorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  sensorIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sensorHalo: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 999,
  },
  sensorAdvisory: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'right',
  },
  sensorLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  sensorValue: {
    fontSize: 19,
    lineHeight: 24,
  },
  sensorCaption: {
    fontSize: 11,
    lineHeight: 15,
  },
  rainLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  rainDropWrap: {
    position: 'absolute',
    top: -26,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  rainGlyph: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  rainGlyphHighlight: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.48)',
    transform: [{ rotate: '18deg' }],
  },
  slotRow: {
    flexDirection: 'row',
  },
  slotTile: {
    minHeight: 108,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: 6,
    overflow: 'hidden',
  },
  slotBackdrop: {
    position: 'absolute',
    width: 118,
    height: 118,
    borderRadius: 999,
    right: -26,
    top: -30,
    opacity: 0.72,
  },
  slotNumber: {
    fontSize: 22,
  },
  slotState: {
    fontSize: 13,
  },
  slotMeta: {
    fontSize: 12,
  },
  vehicleGrid: {
    gap: 12,
  },
  vehicleCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  vehiclePlate: {
    fontSize: 17,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  rowBetweenStacked: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  metaText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
