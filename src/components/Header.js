import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { TYPOGRAPHY } from '../theme/typography';
import { useResponsive } from '../utils/responsive';
import Icon from './Icon';

export const Header = ({
  title,
  subtitle,
  onBack,
  showBack = true,
  rightIcon,
  onRightPress,
  rightComponent,
  transparent = false,
  variant = 'light', // 'light' | 'dark'
  style,
}) => {
  const isDark = variant === 'dark';
  const textColor = isDark ? COLORS.white : COLORS.text;
  const subtitleColor = isDark ? COLORS.textLight : COLORS.textLight;
  const { isCompact } = useResponsive();

  return (
    <View
      style={[
        styles.container,
        isCompact && { paddingHorizontal: SPACING.md, minHeight: 50 },
        transparent ? styles.transparent : isDark ? styles.darkHeader : styles.lightHeader,
        style,
      ]}
    >
      <View style={[styles.leftSlot, isCompact && { width: 36 }]}>
        {showBack && onBack ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack}
            style={[styles.backButton, isCompact && { width: 36, height: 36 }, isDark && styles.darkBackButton]}
          >
            <Icon
              name="arrow-left"
              size={isCompact ? 18 : 20}
              color={isDark ? COLORS.white : COLORS.text}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.titleSlot}>
        {title ? (
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              isCompact && { fontSize: 16 },
              { color: textColor },
            ]}
          >
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text
            numberOfLines={1}
            style={[styles.subtitle, { color: subtitleColor }]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={[styles.rightSlot, isCompact && { width: 36 }]}>
        {rightComponent ? (
          rightComponent
        ) : rightIcon && onRightPress ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onRightPress}
            style={[styles.iconButton, isCompact && { width: 36, height: 36 }, isDark && styles.darkBackButton]}
          >
            <Icon
              name={rightIcon}
              size={isCompact ? 16 : 18}
              color={isDark ? COLORS.white : COLORS.text}
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    minHeight: 56,
  },
  lightHeader: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  darkHeader: {
    backgroundColor: COLORS.backgroundglass,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  leftSlot: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  titleSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  rightSlot: {
    width: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkBackButton: {
    backgroundColor: COLORS.secondBackgroundglass,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...TYPOGRAPHY.title,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
    textAlign: 'center',
  },
});

export default Header;
