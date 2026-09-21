import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { TYPOGRAPHY } from '../theme/typography';
import { useResponsive } from '../utils/responsive';
import Icon from './Icon';

export const CustomButton = ({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'dark'
  size = 'medium', // 'small' | 'medium' | 'large'
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}) => {
  const { isCompact } = useResponsive();
  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryContainer;
      case 'danger':
        return styles.dangerContainer;
      case 'outline':
        return styles.outlineContainer;
      case 'ghost':
        return styles.ghostContainer;
      case 'dark':
        return styles.darkContainer;
      case 'primary':
      default:
        return styles.primaryContainer;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryText;
      case 'danger':
        return styles.dangerText;
      case 'outline':
        return styles.outlineText;
      case 'ghost':
        return styles.ghostText;
      case 'dark':
        return styles.darkText;
      case 'primary':
      default:
        return styles.primaryText;
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'secondary':
      case 'danger':
      case 'dark':
        return COLORS.white;
      case 'outline':
      case 'ghost':
        return COLORS.text;
      case 'primary':
      default:
        return COLORS.text;
    }
  };

  const isSmall = size === 'small';
  const isLarge = size === 'large';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.baseButton,
        isSmall && styles.smallButton,
        isLarge && styles.largeButton,
        isCompact && styles.compactButton,
        getContainerStyle(),
        disabled && styles.disabledContainer,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.white}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && (
            <Icon
              name={icon}
              size={18}
              color={getIconColor()}
              style={styles.leftIcon}
            />
          )}
          <Text
            style={[
              styles.baseText,
              isSmall && styles.smallText,
              getTextStyle(),
              disabled && styles.disabledText,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Icon
              name={icon}
              size={18}
              color={getIconColor()}
              style={styles.rightIcon}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    minHeight: 52,
    borderRadius: RADIUS.large,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  compactButton: {
    paddingHorizontal: SPACING.md,
    minHeight: 46,
  },
  smallButton: {
    minHeight: 40,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.medium,
  },
  largeButton: {
    minHeight: 56,
    paddingHorizontal: SPACING.xxl,
    borderRadius: RADIUS.large,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: SPACING.sm,
  },
  rightIcon: {
    marginLeft: SPACING.sm,
  },
  baseText: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
    textAlign: 'center',
  },
  smallText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
  },
  primaryContainer: {
    backgroundColor: COLORS.primary,
  },
  primaryText: {
    color: COLORS.text,
  },
  secondaryContainer: {
    backgroundColor: COLORS.secondPrimary,
  },
  secondaryText: {
    color: COLORS.white,
  },
  dangerContainer: {
    backgroundColor: COLORS.danger,
  },
  dangerText: {
    color: COLORS.white,
  },
  outlineContainer: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  outlineText: {
    color: COLORS.text,
  },
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: COLORS.secondPrimary,
  },
  darkContainer: {
    backgroundColor: COLORS.backgroundglass,
  },
  darkText: {
    color: COLORS.white,
  },
  disabledContainer: {
    backgroundColor: COLORS.inputBg,
    borderColor: COLORS.border,
    opacity: 0.6,
  },
  disabledText: {
    color: COLORS.textLight,
  },
});

export default CustomButton;
