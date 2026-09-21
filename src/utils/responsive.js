import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Breakpoint Constants
 */
export const BREAKPOINTS = {
  COMPACT: 360,
  PHONE_MAX: 600,
  TABLET_MAX: 840,
};

/**
 * Hook to provide reactive foldable, tablet, landscape and safe-area responsive metrics.
 * Uses useWindowDimensions so any fold/unfold, rotation, or window resize automatically triggers re-render.
 */
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isCompact = width < BREAKPOINTS.COMPACT;
  const isPhone = width >= BREAKPOINTS.COMPACT && width < BREAKPOINTS.PHONE_MAX;
  const isFoldableOrTablet = width >= BREAKPOINTS.PHONE_MAX;
  const isLargeTablet = width >= BREAKPOINTS.TABLET_MAX;
  const isLandscape = width > height;

  // Triggers two-column / split-pane layouts for foldables (unfolded or landscape)
  const isSplitLayout = isFoldableOrTablet || (isLandscape && height < 550);

  // Content width clamping for wide unfolded screens
  const contentMaxWidth = isFoldableOrTablet ? 640 : '100%';
  const formMaxWidth = isFoldableOrTablet ? 500 : '100%';
  const cardMaxWidth = isFoldableOrTablet ? 580 : '100%';
  const modalMaxWidth = Math.min(width - 32, 460);

  const numColumns = isFoldableOrTablet ? 2 : 1;
  const gutter = isCompact ? 12 : isFoldableOrTablet ? 24 : 16;

  // Safe area metrics
  const bottomBarHeight = 56 + Math.max(insets.bottom, 8);
  const bottomSafePadding = Math.max(insets.bottom, 8);
  const topSafePadding = Math.max(insets.top, 8);

  return {
    width,
    height,
    insets,
    isCompact,
    isPhone,
    isFoldableOrTablet,
    isLargeTablet,
    isLandscape,
    isSplitLayout,
    contentMaxWidth,
    formMaxWidth,
    cardMaxWidth,
    modalMaxWidth,
    numColumns,
    gutter,
    bottomBarHeight,
    bottomSafePadding,
    topSafePadding,
  };
};

export default useResponsive;
