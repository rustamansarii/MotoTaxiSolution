import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { TYPOGRAPHY } from '../theme/typography';
import { useResponsive } from '../utils/responsive';
import Icon from './Icon';

export const BottomSheet = ({
  title,
  subtitle,
  children,
  onClose,
  showClose = false,
  variant = 'light', // 'light' | 'dark'
  style,
  contentStyle,
  scrollable = false,
}) => {
  const isDark = variant === 'dark';
  const { isFoldableOrTablet, height, insets } = useResponsive();

  const responsiveSheetStyle = {
    width: '100%',
    maxWidth: isFoldableOrTablet ? 640 : '100%',
    alignSelf: 'center',
    maxHeight: Math.min(height * 0.85, 760),
    paddingBottom: Math.max(insets.bottom, SPACING.lg),
  };

  const ContentWrapper = scrollable ? ScrollView : View;

  return (
    <View
      style={[
        styles.sheetContainer,
        isDark ? styles.darkSheet : styles.lightSheet,
        responsiveSheetStyle,
        style,
      ]}
    >
      {/* Top Grab Handle */}
      <View style={styles.handleContainer}>
        <View
          style={[
            styles.grabHandle,
            isDark ? styles.darkHandle : styles.lightHandle,
          ]}
        />
      </View>

      {/* Header Row */}
      {(title || showClose) && (
        <View style={styles.headerRow}>
          <View style={styles.headerTitles}>
            {title ? (
              <Text
                style={[
                  styles.titleText,
                  { color: isDark ? COLORS.white : COLORS.text },
                ]}
              >
                {title}
              </Text>
            ) : null}
            {subtitle ? (
              <Text
                style={[
                  styles.subtitleText,
                  { color: isDark ? COLORS.textLight : COLORS.textLight },
                ]}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>

          {showClose && onClose ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[
                styles.closeButton,
                isDark && styles.darkCloseButton,
              ]}
            >
              <Icon
                name="close"
                size={16}
                color={isDark ? COLORS.white : COLORS.text}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* Content Body */}
      <ContentWrapper
        showsVerticalScrollIndicator={false}
        style={[styles.body, contentStyle]}
      >
        {children}
      </ContentWrapper>
    </View>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    borderTopLeftRadius: RADIUS.extraLarge,
    borderTopRightRadius: RADIUS.extraLarge,
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    borderTopWidth: 1,
  },
  lightSheet: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
  },
  darkSheet: {
    backgroundColor: COLORS.backgroundglass,
    borderColor: COLORS.secondBackgroundglass,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  grabHandle: {
    width: 44,
    height: 5,
    borderRadius: RADIUS.round,
  },
  lightHandle: {
    backgroundColor: COLORS.border,
  },
  darkHandle: {
    backgroundColor: COLORS.secondBackgroundglass,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  headerTitles: {
    flex: 1,
  },
  titleText: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
  },
  subtitleText: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  darkCloseButton: {
    backgroundColor: COLORS.secondBackgroundglass,
  },
  body: {
    marginTop: SPACING.xs,
  },
});

export default BottomSheet;
