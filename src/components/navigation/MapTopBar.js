import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import { useResponsive } from '../../utils/responsive';
import Icon from '../Icon';

/**
 * MapTopBar renders the floating navigation header:
 * ← Trip                         ⋮
 * Respects safe-area top inset and handles foldable max-width.
 */
export const MapTopBar = ({
  title = 'Trip',
  onBack,
  onMenu,
  style,
}) => {
  const insets = useSafeAreaInsets();
  const { isFoldableOrTablet, width } = useResponsive();

  const topInset = Math.max(insets.top, Platform.OS === 'ios' ? 44 : 20);

  return (
    <View
      style={[
        styles.wrapper,
        {
          top: topInset + SPACING.sm,
          maxWidth: isFoldableOrTablet ? 560 : width - SPACING.lg * 2,
        },
        style,
      ]}
    >
      <View style={styles.bar}>
        {/* Back button with title */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-left" size={22} color={COLORS.text} />
          <Text style={styles.title}>{title}</Text>
        </TouchableOpacity>

        {/* Menu button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onMenu}
          style={styles.menuButton}
          accessibilityRole="button"
          accessibilityLabel="Trip menu options"
        >
          <Icon name="more-vertical" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
    alignSelf: 'center',
    zIndex: 20,
    width: '100%',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: RADIUS.extraLarge,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  title: {
    ...TYPOGRAPHY.title,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  demoChip: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.small,
  },
  demoChipText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryDark,
    letterSpacing: 0.5,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MapTopBar;
