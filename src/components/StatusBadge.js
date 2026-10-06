import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { TYPOGRAPHY } from '../theme/typography';
import { responsiveFont } from '../utils/responsive';

export const StatusBadge = ({
  status = 'active', // 'online' | 'offline' | 'completed' | 'in_progress' | 'cancelled' | 'pending' | 'warning'
  label,
  style,
  size = 'medium', // 'small' | 'medium'
}) => {
  const getBadgeStyle = () => {
    switch (status.toLowerCase()) {
      case 'online':
      case 'completed':
      case 'verified':
      case 'success':
        return {
          bg: COLORS.primaryLight,
          border: COLORS.primary,
          text: COLORS.primaryDark,
          dot: COLORS.primary,
        };
      case 'in_progress':
      case 'active':
      case 'arrived':
      case 'accepted':
        return {
          bg: COLORS.secondPrimaryLight,
          border: COLORS.secondPrimary,
          text: COLORS.secondPrimaryDark,
          dot: COLORS.secondPrimary,
        };
      case 'warning':
      case 'pending':
      case 'under_review':
        return {
          bg: COLORS.warning,
          border: COLORS.warning,
          text: COLORS.text,
          dot: COLORS.text,
        };
      case 'cancelled':
      case 'danger':
      case 'rejected':
      case 'error':
        return {
          bg: COLORS.inputBg,
          border: COLORS.danger,
          text: COLORS.danger,
          dot: COLORS.danger,
        };
      case 'offline':
      default:
        return {
          bg: COLORS.inputBg,
          border: COLORS.border,
          text: COLORS.textLight,
          dot: COLORS.iconLight,
        };
    }
  };

  const badgeConfig = getBadgeStyle();
  const displayLabel = label || status.replace('_', ' ').toUpperCase();
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: badgeConfig.bg,
          borderColor: badgeConfig.border,
        },
        isSmall && styles.smallBadge,
        style,
      ]}
    >
      <View
        style={[
          styles.dot,
          { backgroundColor: badgeConfig.dot },
          isSmall && styles.smallDot,
        ]}
      />
      <Text
        style={[
          styles.badgeText,
          { color: badgeConfig.text },
          isSmall && styles.smallBadgeText,
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  smallBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.round,
    marginRight: SPACING.xs,
  },
  smallDot: {
    width: 6,
    height: 6,
    marginRight: 4,
  },
  badgeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    fontSize: responsiveFont(11),
    letterSpacing: 0.5,
  },
  smallBadgeText: {
    fontSize: responsiveFont(10),
  },
});

export default StatusBadge;
