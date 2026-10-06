import { Dimensions, PixelRatio, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: INITIAL_WIDTH, height: INITIAL_HEIGHT } = Dimensions.get('window');

/**
 * Breakpoint Constants
 */
export const BREAKPOINTS = {
  COMPACT: 360,
  PHONE_MAX: 600,
  TABLET_MAX: 840,
};

/**
 * Tablet & Device Detection
 */
export const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const minDim = Math.min(width, height);
  return minDim >= 600;
};

export const IS_TABLET = isTablet();
export const isSmallDevice = INITIAL_WIDTH < BREAKPOINTS.COMPACT;
export const isLandscape = INITIAL_WIDTH > INITIAL_HEIGHT;

export const SCREEN_WIDTH = INITIAL_WIDTH;
export const SCREEN_HEIGHT = INITIAL_HEIGHT;

/**
 * Adaptive Guideline Bases:
 * Mobile baseline: 375 x 812
 * Tablet baseline: 768 x 1024
 */
const guidelineBaseWidth = IS_TABLET ? 768 : 375;
const guidelineBaseHeight = IS_TABLET ? 1024 : 812;

/**
 * Screen percentage helpers (with optional max-clamping for tablet layouts)
 */
export const wp = (percent, maxPx) => {
  const { width } = Dimensions.get('window');
  const val = (width * percent) / 100;
  return maxPx ? Math.min(val, maxPx) : val;
};

export const hp = (percent, maxPx) => {
  const { height } = Dimensions.get('window');
  const val = (height * percent) / 100;
  return maxPx ? Math.min(val, maxPx) : val;
};

/**
 * Clamped Scaling:
 * Prevents elements from blowing up to 2x-3x on tablets
 */
export const scale = (size) => {
  if (!size && size !== 0) return 0;
  const { width } = Dimensions.get('window');
  const scaled = (width / guidelineBaseWidth) * size;
  return IS_TABLET ? Math.min(scaled, size * 1.35) : scaled;
};

export const verticalScale = (size) => {
  if (!size && size !== 0) return 0;
  const { height } = Dimensions.get('window');
  const scaled = (height / guidelineBaseHeight) * size;
  return IS_TABLET ? Math.min(scaled, size * 1.3) : scaled;
};

export const moderateScale = (size, factor = IS_TABLET ? 0.3 : 0.5) => {
  if (!size && size !== 0) return 0;
  return size + (scale(size) - size) * factor;
};

/**
 * Tablet-Safe Responsive Font:
 * Scales smoothly on phones and clamps moderately on tablets so text stays legible and elegant
 */
export const responsiveFont = (size, factor = IS_TABLET ? 0.25 : 0.45) => {
  if (!size && size !== 0) return 14;
  const calculated = moderateScale(size, factor);
  return Math.round(PixelRatio.roundToNearestPixel(calculated));
};

export const responsiveWidth = (value) => scale(value);
export const responsiveHeight = (value) => verticalScale(value);

/**
 * Hook to provide reactive foldable, tablet, landscape and safe-area responsive metrics.
 * Uses useWindowDimensions so any fold/unfold, rotation, or window resize automatically triggers re-render.
 */
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const minDim = Math.min(width, height);
  const isTabletDevice = minDim >= 600;

  const isCompact = width < BREAKPOINTS.COMPACT;
  const isPhone = width >= BREAKPOINTS.COMPACT && width < BREAKPOINTS.PHONE_MAX;
  const isFoldableOrTablet = width >= BREAKPOINTS.PHONE_MAX || isTabletDevice;
  const isLargeTablet = width >= BREAKPOINTS.TABLET_MAX;
  const isLandscapeMode = width > height;

  // Triggers two-column / split-pane layouts for foldables (unfolded or landscape)
  const isSplitLayout = isFoldableOrTablet || (isLandscapeMode && height < 550);

  // Content width clamping for wide unfolded screens
  const contentMaxWidth = isFoldableOrTablet ? 640 : '100%';
  const formMaxWidth = isFoldableOrTablet ? 500 : '100%';
  const cardMaxWidth = isFoldableOrTablet ? 580 : '100%';
  const modalMaxWidth = Math.min(width - 32, 480);

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
    isLandscape: isLandscapeMode,
    isTablet: isTabletDevice,
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
    // Responsive helper functions
    responsiveFont,
    scale,
    verticalScale,
    moderateScale,
    wp: (percent, maxPx) => {
      const val = (width * percent) / 100;
      return maxPx ? Math.min(val, maxPx) : val;
    },
    hp: (percent, maxPx) => {
      const val = (height * percent) / 100;
      return maxPx ? Math.min(val, maxPx) : val;
    },
  };
};

export default useResponsive;
