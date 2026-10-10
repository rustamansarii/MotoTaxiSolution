import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  BackHandler,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import RatingStars from '../../components/RatingStars';
import CustomButton from '../../components/CustomButton';
import Icon from '../../components/Icon';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import { useTranslation } from 'react-i18next';
import { useResponsive, responsiveFont } from '../../utils/responsive';
import { formatCurrency } from '../../utils/formatters';
import {
  resetActiveRideState,
  driverCompleteTrip,
} from '../../redux/features/driver/driverSlice';

const COMPLIMENT_OPTIONS = [
  { id: 'polite', labelKey: 'driver.complimentPolite', defaultLabel: 'Polite & Friendly', icon: 'smile' },
  { id: 'ontime', labelKey: 'driver.complimentOntime', defaultLabel: 'Ready on Time', icon: 'clock' },
  { id: 'clean', labelKey: 'driver.complimentClean', defaultLabel: 'Respectful Rider', icon: 'shield' },
  { id: 'tip', labelKey: 'driver.complimentTip', defaultLabel: 'Generous Tipper', icon: 'heart' },
];

export const DriverTripCompletedScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { insets } = useResponsive();
  const dispatch = useDispatch();
  const { completedRide, activeRide, actionLoading } = useSelector((state) => state.driver);
  const ride = completedRide || activeRide;

  const pickup =
    route.params?.pickup ||
    ride?.pickup_address ||
    ride?.pickup ||
    t('driver.pickupDestinationFallback', t('rider.pickupLocation', 'Pickup Location'));
  const destination =
    route.params?.destination ||
    ride?.drop_address ||
    ride?.destination_address ||
    ride?.destination ||
    t('driver.dropoffDestinationFallback', t('rider.dropoffLocation', 'Drop-off Destination'));
  const fare = route.params?.fare ?? ride?.driver_payout ?? ride?.fare ?? 28.5;
  const currency = route.params?.currency || ride?.currency || 'USD';
  const passengerName =
    route.params?.passengerName ||
    ride?.rider_name ||
    ride?.passengerName ||
    t('driver.rider', 'Rider');
  const distance =
    route.params?.distance ||
    (ride?.distance_km !== undefined
      ? `${ride.distance_km} ${t('navigation.km', 'km')}`
      : `2.1 ${t('navigation.km', 'km')}`);
  const duration =
    route.params?.duration || `12 ${t('navigation.min', 'mins')}`;
  const rawVehicleType =
    route.params?.vehicleType || ride?.vehicle_type || 'Moto Taxi';
  const vehicleType =
    rawVehicleType === 'Moto Taxi'
      ? t('driver.motoTaxi', 'Moto Taxi')
      : rawVehicleType;

  const [rating, setRating] = useState(5);
  const [selectedCompliments, setSelectedCompliments] = useState(['polite', 'ontime']);
  const [isFinishing, setIsFinishing] = useState(false);

  const surgeBonus = 3.5;
  const tipBonus = 5.0;
  const totalEarned = fare + surgeBonus + tipBonus;

  const toggleCompliment = (id) => {
    setSelectedCompliments((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getRatingFeedback = (score) => {
    switch (score) {
      case 5:
        return t('driver.ratingOutstanding', '🌟 Outstanding Rider!');
      case 4:
        return t('driver.ratingGreat', '👍 Great Experience');
      case 3:
        return t('driver.ratingAverage', '😐 Average Trip');
      case 2:
        return t('driver.ratingBelow', '👎 Below Expectation');
      case 1:
        return t('driver.ratingPoor', '⚠️ Poor Experience');
      default:
        return t('driver.rateExperience', 'Rate Experience');
    }
  };

  const handleRate = useCallback(() => {
    const effectiveRideId =
      Number(
        route.params?.ride_id ||
          route.params?.rideId ||
          ride?.ride_id ||
          ride?.id,
      ) || 1;

    console.log(
      '[DriverTripCompleted] Navigating to Rating screen for ride_id:',
      effectiveRideId,
    );

    navigation.reset({
  index: 0,
  routes: [{ name: 'DriverHome' }],
});
  }, [navigation, ride, route.params, passengerName, totalEarned, fare, currency]);

  const handleFinish = useCallback(() => {
    handleRate();
  }, [handleRate]);

  useEffect(() => {
    const backAction = () => {
      handleRate();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [handleRate]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ResponsiveContainer maxWidth={560} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + SPACING.xl, SPACING.xxxl) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Success Checkmark Circle */}
          <View style={styles.checkCircleOuter}>
            <View style={styles.checkCircle}>
              <Icon name="check" size={34} color={COLORS.primaryDark} />
            </View>
          </View>

          <Text style={styles.title}>
            {t('driver.tripCompletedTitle', t('driver.tripCompleted', 'Trip Completed!'))}
          </Text>
          <Text style={styles.subtitle}>
            {t(
              'driver.tripCompletedSubtitle',
              'Great job! Earnings have been credited to your active driver wallet.',
            )}
          </Text>

          {/* Passenger Identity Pill */}
          <View style={styles.passengerBar}>
            <View style={styles.passengerAvatar}>
              <Text style={styles.passengerInitial}>
                {passengerName ? passengerName.charAt(0).toUpperCase() : 'R'}
              </Text>
            </View>
            <View style={styles.passengerMeta}>
              <Text style={styles.passengerName} numberOfLines={1}>
                {passengerName}
              </Text>
              <View style={styles.passengerRatingRow}>
                <Icon name="star" size={11} color="#F59E0B" />
                <Text style={styles.passengerRatingText}>
                  5.0 ★ {t('driver.rider', 'Rider')}
                </Text>
              </View>
            </View>
            <View style={styles.paidBadge}>
              <Icon name="check" size={12} color="#047857" />
              <Text style={styles.paidBadgeText}>{t('driver.paid', 'Paid')}</Text>
            </View>
          </View>

          {/* Total Earned Card */}
          <View style={styles.earningsCard}>
            <View style={styles.earningsHeaderRow}>
              <Text style={styles.earningsLabel}>
                {t('driver.totalEarned', t('driver.totalEarnings', 'TOTAL EARNED')).toUpperCase()}
              </Text>
              <View style={styles.walletCreditedChip}>
                <Icon name="wallet" size={12} color={COLORS.primaryDark} />
                <Text style={styles.walletCreditedText}>
                  {t('driver.inWallet', 'In Wallet')}
                </Text>
              </View>
            </View>

            <Text style={styles.earningsAmount}>
              {formatCurrency(fare, currency === 'USD' ? '$' : currency)}
            </Text>


          </View>

          {/* Pick and Drop Route Summary */}
          <View style={styles.routeCard}>
            <View style={styles.routeTimeline}>
              <View style={styles.pickupDot} />
              <View style={styles.routeLine} />
              <View style={styles.dropSquare} />
            </View>
            <View style={styles.routeAddresses}>
              <View style={styles.addressBlock}>
                <Text style={styles.addressLabel}>
                  {t('driver.pickupLocationLabel', t('rider.pickupLocation', 'PICKUP')).toUpperCase()}
                </Text>
                <Text numberOfLines={1} style={styles.addressText}>
                  {pickup}
                </Text>
              </View>
              <View style={[styles.addressBlock, { marginTop: SPACING.sm }]}>
                <Text style={styles.addressLabel}>
                  {t('driver.dropoffLocationLabel', t('rider.dropoffLocation', 'DROPOFF')).toUpperCase()}
                </Text>
                <Text numberOfLines={1} style={styles.addressText}>
                  {destination}
                </Text>
              </View>
            </View>
          </View>

          {/* Trip Metrics Pills */}
          <View style={styles.statsCard}>
            <View style={styles.statCol}>
              <Text style={styles.statNum}>{distance}</Text>
              <Text style={styles.statLabel}>{t('navigation.distance', 'Distance')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statNum}>{duration}</Text>
              <Text style={styles.statLabel}>
                {t('driver.durationLabel', 'Duration')}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statNum}>{vehicleType}</Text>
              <Text style={styles.statLabel}>
                {t('driver.vehicleLabel', 'Vehicle')}
              </Text>
            </View>
          </View>

       

          {/* Rate Passenger Action Button */}
          <CustomButton
            title={t('driver.ratePassengerBtn', t('driver.ratePassenger', 'Rate Passenger ›'))}
            onPress={handleRate}
            loading={isFinishing || actionLoading}
            disabled={isFinishing || actionLoading}
            variant="primary"
            // icon="star"
            iconPosition="right"
            style={styles.nextBtn}
          />
        </ScrollView>
      </ResponsiveContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  checkCircleOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  checkCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...TYPOGRAPHY.h2,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  passengerBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.medium,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  passengerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  passengerInitial: {
    fontSize: responsiveFont(16),
    fontWeight: '800',
    color: COLORS.white,
  },
  passengerMeta: {
    flex: 1,
  },
  passengerName: {
    fontSize: responsiveFont(14),
    fontWeight: '700',
    color: COLORS.text,
  },
  passengerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  passengerRatingText: {
    fontSize: responsiveFont(11),
    fontWeight: '600',
    color: COLORS.textLight,
    marginLeft: 3,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
  },
  paidBadgeText: {
    fontSize: responsiveFont(11),
    fontWeight: '700',
    color: '#047857',
    marginLeft: 3,
  },
  earningsCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: SPACING.md,
  },
  earningsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  earningsLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  walletCreditedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.round,
  },
  walletCreditedText: {
    fontSize: responsiveFont(10),
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginLeft: 4,
  },
  earningsAmount: {
    ...TYPOGRAPHY.h1,
    fontSize: responsiveFont(38),
    fontWeight: '900',
    color: COLORS.primaryDark,
    textAlign: 'center',
    marginVertical: SPACING.xs,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  labelWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textLight,
    fontSize: responsiveFont(13),
  },
  breakdownVal: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.text,
    fontSize: responsiveFont(13),
  },
  surgeVal: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: '#059669',
    fontSize: responsiveFont(13),
  },
  tipVal: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: '#059669',
    fontSize: responsiveFont(13),
  },
  routeCard: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: COLORS.inputBg,
    padding: SPACING.md,
    borderRadius: RADIUS.large,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  routeTimeline: {
    alignItems: 'center',
    width: 20,
    marginRight: SPACING.sm,
    paddingVertical: 4,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primaryDark,
  },
  routeLine: {
    width: 2,
    flex: 1,
    minHeight: 22,
    backgroundColor: COLORS.border,
    marginVertical: 3,
  },
  dropSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: COLORS.secondPrimary,
  },
  routeAddresses: {
    flex: 1,
  },
  addressBlock: {
    justifyContent: 'center',
  },
  addressLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.textLight,
    fontSize: responsiveFont(10),
    letterSpacing: 0.5,
  },
  addressText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  statsCard: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    height: '70%',
    alignSelf: 'center',
  },
  rateCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  rateTitle: {
    ...TYPOGRAPHY.title,
    fontWeight: '800',
    color: COLORS.text,
  },
  rateSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
    textAlign: 'center',
  },
  stars: {
    marginVertical: SPACING.md,
  },
  ratingFeedbackBadge: {
    fontSize: responsiveFont(12),
    fontWeight: '700',
    color: COLORS.text,
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
    marginBottom: SPACING.md,
  },
  complimentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  complimentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  complimentChipSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  complimentText: {
    fontSize: responsiveFont(11),
    fontWeight: '600',
    color: COLORS.textLight,
  },
  complimentTextSelected: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  nextBtn: {
    width: '100%',
  },
});

export default DriverTripCompletedScreen;
