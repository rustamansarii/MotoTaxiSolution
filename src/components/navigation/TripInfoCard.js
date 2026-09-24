import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import { useResponsive } from '../../utils/responsive';
import CustomButton from '../CustomButton';
import Icon from '../Icon';

export const TripInfoCard = ({
  duration = '12 min',
  distance = '4.8 km',
  instruction = 'Follow the highlighted route',
  destinationTitle = 'Destination',
  destinationAddress = '123 Main Street',
  tripState = 'IDLE', // 'IDLE' | 'RUNNING' | 'ARRIVING' | 'COMPLETED'
  onStartTrip,
  onPauseTrip,
  onFinishTrip,
  onResetTrip,
  style,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isCompact, isFoldableOrTablet, width } = useResponsive();

  const isCompleted = tripState === 'COMPLETED';
  const isRunning = tripState === 'RUNNING' || tripState === 'ARRIVING';

  return (
    <View
      style={[
        styles.wrapper,
        {
          maxWidth: isFoldableOrTablet ? 560 : width - SPACING.lg * 2,
          paddingBottom: Math.max(insets.bottom, SPACING.md),
        },
        style,
      ]}
    >
      <View style={styles.card}>
        {/* State Banner (if Arriving or Completed) */}
        {isCompleted && (
          <View style={styles.completedBanner}>
            <Icon name="check-circle" size={16} color={COLORS.success} />
            <Text style={styles.completedBannerText}>Trip Completed • Arrived at destination</Text>
          </View>
        )}

        {tripState === 'ARRIVING' && (
          <View style={styles.arrivingBanner}>
            <Icon name="navigate" size={14} color={COLORS.secondPrimary} />
            <Text style={styles.arrivingBannerText}>Near Destination • Prepare to drop off</Text>
          </View>
        )}

        {/* Top Metric Row: Duration & Distance */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCol}>
            <Text style={styles.metricVal}>{duration}</Text>
            <Text style={styles.metricSub}>{t('navigation.eta')}</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={[styles.metricCol, styles.metricColRight]}>
            <Text style={styles.metricVal}>{distance}</Text>
            <Text style={styles.metricSub}>{t('navigation.distance')}</Text>
          </View>
        </View>

        {/* Instruction Row */}
        <View style={styles.instructionContainer}>
          <View style={styles.instructionIconWrapper}>
            <Icon
              name={isRunning ? 'navigation' : 'info'}
              size={18}
              color={COLORS.secondPrimary}
            />
          </View>
          <Text
            numberOfLines={2}
            style={[styles.instructionText, isCompact && styles.instructionTextCompact]}
          >
            {instruction}
          </Text>
        </View>

        {/* Destination Row */}
        <View style={styles.destinationContainer}>
          <View style={styles.destinationIcon}>
            <Icon name="flag" size={16} color={COLORS.secondPrimary} />
          </View>
          <View style={styles.destinationTextGroup}>
            <Text style={styles.destinationLabel}>{destinationTitle}</Text>
            <Text numberOfLines={1} style={styles.destinationAddress}>
              {destinationAddress}
            </Text>
          </View>
        </View>

        {/* Action Button CTA */}
        <View style={styles.ctaRow}>
          {tripState === 'IDLE' && (
            <CustomButton
              title={t('driver.startTrip')}
              onPress={onStartTrip}
              variant="secondary"
              icon="navigation"
              iconPosition="left"
              style={styles.ctaBtn}
            />
          )}

          {isRunning && (
            <View style={styles.runningActions}>
              <CustomButton
                title="Pause Demo"
                onPress={onPauseTrip}
                variant="outline"
                size="medium"
                icon="time"
                style={styles.pauseBtn}
              />
              <CustomButton
                title={t('driver.completeTrip')}
                onPress={onFinishTrip}
                variant="secondary"
                size="medium"
                icon="check"
                style={styles.finishEarlyBtn}
              />
            </View>
          )}

          {isCompleted && (
            <View style={styles.completedActions}>
              <CustomButton
                title="Restart Demo"
                onPress={onResetTrip}
                variant="outline"
                size="medium"
                icon="refresh"
                style={styles.pauseBtn}
              />
              <CustomButton
                title={t('driver.completeTrip')}
                onPress={onFinishTrip}
                variant="secondary"
                size="medium"
                icon="check"
                style={styles.finishEarlyBtn}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.lg,
    right: SPACING.lg,
    alignSelf: 'center',
    zIndex: 20,
    width: '100%',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.extraLarge,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  completedBannerText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  arrivingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.secondPrimaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.secondPrimary,
  },
  arrivingBannerText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.secondPrimaryDark,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderColor: COLORS.borderLight,
  },
  metricCol: {
    flex: 1,
  },
  metricColRight: {
    alignItems: 'flex-end',
  },
  metricVal: {
    ...TYPOGRAPHY.h2,
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  metricSub: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textLight,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.medium,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  instructionIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.secondPrimaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  instructionTextCompact: {
    fontSize: 12,
  },
  destinationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  destinationIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.secondPrimaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationTextGroup: {
    flex: 1,
  },
  destinationLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
  },
  destinationAddress: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 1,
  },
  ctaRow: {
    width: '100%',
  },
  ctaBtn: {
    width: '100%',
  },
  runningActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  completedActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  pauseBtn: {
    flex: 1,
  },
  finishEarlyBtn: {
    flex: 1.2,
  },
});

export default TripInfoCard;
