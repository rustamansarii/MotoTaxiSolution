import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { responsiveFont } from '../utils/responsive';
import { COLORS } from '../theme/colors';

const MAIN_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  '3xl': 28,
};

const SUB_SIZES = {
  xs: 10,
  sm: 12,
  md: 13,
  lg: 15,
  xl: 17,
  xxl: 19,
};

/**
 * 1. MainText: Responsive primary text for titles, headings, prices, and prominent labels.
 */
export const MainText = ({
  children,
  size = 'md',
  weight = '700',
  color = COLORS.text,
  align = 'left',
  style,
  allowFontScaling = false,
  ...props
}) => {
  const baseFontSize = typeof size === 'number' ? size : (MAIN_SIZES[size] || 16);
  const fontSize = responsiveFont(baseFontSize);
  const lineHeight = Math.round(fontSize * 1.3);

  return (
    <Text
      allowFontScaling={allowFontScaling}
      style={[
        styles.mainTextBase,
        {
          fontSize,
          lineHeight,
          fontWeight: weight,
          color,
          textAlign: align,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

/**
 * 2. SubText: Responsive secondary text for subtitles, descriptions, hints, and captions.
 */
export const SubText = ({
  children,
  size = 'sm',
  weight = '400',
  color = COLORS.textLight,
  align = 'left',
  style,
  allowFontScaling = false,
  ...props
}) => {
  const baseFontSize = typeof size === 'number' ? size : (SUB_SIZES[size] || 12);
  const fontSize = responsiveFont(baseFontSize);
  const lineHeight = Math.round(fontSize * 1.35);

  return (
    <Text
      allowFontScaling={allowFontScaling}
      style={[
        styles.subTextBase,
        {
          fontSize,
          lineHeight,
          fontWeight: weight,
          color,
          textAlign: align,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  mainTextBase: {
    letterSpacing: 0.2,
  },
  subTextBase: {
    letterSpacing: 0.1,
  },
});

export default {
  Main: MainText,
  Sub: SubText,
};
