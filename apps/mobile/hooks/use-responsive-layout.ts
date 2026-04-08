import { useWindowDimensions } from 'react-native';

interface GridOptions {
  minItemWidth: number;
  gap?: number;
  maxColumns?: number;
}

interface GridItemWidthOptions {
  columns: number;
  gap?: number;
}

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  const viewportWidth = Math.max(width, 320);
  const viewportHeight = Math.max(height, 568);
  const isCompact = viewportWidth < 360;
  const isRegularPhone = viewportWidth >= 360 && viewportWidth < 393;
  const isWidePhone = viewportWidth >= 393 && viewportWidth < 412;
  const isLargePhone = viewportWidth >= 412 && viewportWidth < 480;
  const isExtraLargePhone = viewportWidth >= 480 && viewportWidth < 600;
  const isTablet = viewportWidth >= 600;
  const isLargeScreen = viewportWidth >= 960;
  const horizontalPadding = isCompact
    ? 14
    : isRegularPhone
      ? 16
      : isWidePhone
        ? 18
        : isLargePhone
          ? 20
          : isExtraLargePhone || isTablet
            ? 24
            : 16;
  const heroPadding = horizontalPadding;
  const contentMaxWidth = isLargeScreen ? 1040 : isTablet ? 880 : viewportWidth;
  const narrowMaxWidth = isTablet ? 720 : viewportWidth;
  const sectionGap = isCompact
    ? 14
    : isWidePhone
      ? 18
      : isLargePhone || isExtraLargePhone || isTablet
        ? 20
        : 16;
  const boundedWidth = Math.min(viewportWidth, contentMaxWidth);
  const availableWidth = Math.max(boundedWidth - horizontalPadding * 2, 0);

  const getGridColumns = ({
    minItemWidth,
    gap = 12,
    maxColumns = 2,
  }: GridOptions) => {
    const estimatedColumns = Math.floor((availableWidth + gap) / (minItemWidth + gap));

    return Math.max(1, Math.min(maxColumns, estimatedColumns || 1));
  };

  const getGridItemWidth = ({
    columns,
    gap = 12,
  }: GridItemWidthOptions) => {
    if (columns <= 1) {
      return availableWidth;
    }

    return Math.max((availableWidth - gap * (columns - 1)) / columns, 0);
  };

  return {
    viewportWidth,
    viewportHeight,
    isCompact,
    isRegularPhone,
    isWidePhone,
    isLargePhone,
    isExtraLargePhone,
    isTablet,
    isLargeScreen,
    horizontalPadding,
    heroPadding,
    contentMaxWidth,
    narrowMaxWidth,
    sectionGap,
    availableWidth,
    getGridColumns,
    getGridItemWidth,
  };
}
