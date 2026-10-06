import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import CustomButton from '../../components/CustomButton';
import Icon from '../../components/Icon';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import { useTranslation } from 'react-i18next';
import { useResponsive, responsiveFont } from '../../utils/responsive';
import { formatCurrency } from '../../utils/formatters';
import { MOCK_RIDES } from '../../data/mockRides';
import { bookRide } from '../../redux/features/rides/ridesSlice';
import {
  connectRiderWebSocket,
  clearRiderTripState,
  setActiveRideId,
  setRideOtp,
  setTripStatus,
} from '../../redux/features/rider/riderSlice';

export const ConfirmRideScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { insets } = useResponsive();
  const dispatch = useDispatch();

  const { isBooking } = useSelector((state) => state.rides);

  const selectedRide = route.params?.selectedRide || MOCK_RIDES[0];
  const pickup = route.params?.pickup || 'Pickup Location';
  const destination = route.params?.destination || 'Drop-off Destination';

  // Distance & Duration estimate if available
  const distanceKm =
    route.params?.distance_km ??
    route.params?.fareEstimate?.distance_km ??
    null;
  const durationMin =
    route.params?.duration_min ??
    route.params?.fareEstimate?.duration_min ??
    null;

  // Total Fare calculation
  const totalFare = Number(
    route.params?.totalFare ??
    selectedRide?.price ??
    selectedRide?.fare ??
    selectedRide?.estimated_fare ??
    45
  );

  const vehicleType =
    selectedRide?.vehicle_type ||
    (selectedRide?.name?.toUpperCase().includes('CAR') || selectedRide?.name?.toUpperCase().includes('CAB')
      ? 'CAR'
      : selectedRide?.name?.toUpperCase().includes('AUTO')
      ? 'AUTO'
      : 'BIKE');

  const vehicleIcon =
    selectedRide?.iconType ||
    selectedRide?.icon ||
    (vehicleType === 'CAR' ? 'car' : vehicleType === 'AUTO' ? 'auto' : 'bike');

  const capacityLabel =
    vehicleType === 'BIKE' ? '1 Person' : vehicleType === 'AUTO' ? '3 Seats' : '4 Seats';

  const handleConfirm = async () => {
    const pLat =
      route.params?.pickup_lat ??
      route.params?.pickupData?.latitude ??
      route.params?.pickupData?.lat ??
      30.7046;

    const pLon =
      route.params?.pickup_lon ??
      route.params?.pickupData?.longitude ??
      route.params?.pickupData?.lon ??
      76.8016;

    const dLat =
      route.params?.drop_lat ??
      route.params?.destinationData?.latitude ??
      route.params?.destinationData?.lat ??
      30.7333;

    const dLon =
      route.params?.drop_lon ??
      route.params?.destinationData?.longitude ??
      route.params?.destinationData?.lon ??
      76.7794;

    const bookingPayload = {
      pickup_lat: pLat,
      pickup_lon: pLon,
      pickup_address: pickup || 'Pickup Location',
      drop_lat: dLat,
      drop_lon: dLon,
      drop_address: destination || 'Drop-off Location',
      vehicle_type: vehicleType,
    };

    // Clear previous trip state and ensure Rider WebSocket connects
    dispatch(clearRiderTripState());
    dispatch(connectRiderWebSocket());

    try {
      const bookingResult = await dispatch(bookRide(bookingPayload)).unwrap();
      const rideId =
        bookingResult?.ride_id ||
        bookingResult?.id ||
        bookingResult?.data?.ride_id ||
        bookingResult?.data?.id ||
        bookingResult?.ride?.id;
      const otp =
        bookingResult?.otp ||
        bookingResult?.data?.otp ||
        bookingResult?.ride?.otp;

      if (rideId) {
        dispatch(setActiveRideId(rideId));
      }
      if (otp) {
        dispatch(setRideOtp(otp));
      }
      dispatch(setTripStatus('searching'));

      navigation.navigate('SearchingDriver', {
        selectedRide,
        pickup,
        destination,
        totalFare,
        booking: bookingResult,
        bookingPayload,
        rideId,
        otp,
        pickup_lat: pLat,
        pickup_lon: pLon,
        drop_lat: dLat,
        drop_lon: dLon,
        distance_km: distanceKm,
      });
    } catch (err) {
      console.warn('[ConfirmRide] Booking API call result:', err);
      dispatch(setTripStatus('searching'));
      navigation.navigate('SearchingDriver', {
        selectedRide,
        pickup,
        destination,
        totalFare,
        bookingError: err,
        bookingPayload,
        pickup_lat: pLat,
        pickup_lon: pLon,
        drop_lat: dLat,
        drop_lon: dLon,
        distance_km: distanceKm,
      });
    }
  };

  // 1. ROUTE CARD (User-Friendly, Sleek, Professional)
  const routeCard = (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardHeaderLeft}>
          <Icon name="navigation" size={14} color={COLORS.primary} />
          <Text style={styles.cardHeaderTitle}>
            {t('rider.tripRoute', 'TRIP ROUTE')}
          </Text>
        </View>

        {distanceKm ? (
          <View style={styles.tripMetaBadge}>
            <Text style={styles.tripMetaText}>
              {Number(distanceKm).toFixed(1)} km
              {durationMin ? ` • ~${Math.round(durationMin)} min` : ''}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Pickup Point */}
      <View style={styles.routeItemRow}>
        <View style={styles.pickupIndicatorContainer}>
          <View style={styles.pickupOuterRing}>
            <View style={styles.pickupInnerDot} />
          </View>
        </View>

        <View style={styles.routeTextCol}>
          <Text style={styles.routeSublabel}>
            {t('rider.pickup', 'PICKUP LOCATION')}
          </Text>
          <Text numberOfLines={2} style={styles.routeAddressText}>
            {pickup}
          </Text>
        </View>
      </View>

      {/* Route Connecting Line */}
      <View style={styles.connectorContainer}>
        <View style={styles.connectorLine} />
      </View>

      {/* Drop-off Point */}
      <View style={styles.routeItemRow}>
        <View style={styles.dropIndicatorContainer}>
          <View style={styles.dropSquare}>
            <View style={styles.dropInnerDot} />
          </View>
        </View>

        <View style={styles.routeTextCol}>
          <Text style={styles.routeSublabel}>
            {t('rider.destination', 'DROP-OFF LOCATION')}
          </Text>
          <Text numberOfLines={2} style={styles.routeAddressText}>
            {destination}
          </Text>
        </View>
      </View>
    </View>
  );

  // 2. VEHICLE CARD (Modern, Prominent Fare & Vehicle Highlights)
  const vehicleCard = (
    <View style={styles.card}>
      <View style={styles.vehicleMainRow}>
        {/* Vehicle Avatar Icon */}
        <View style={styles.vehicleAvatarBox}>
          <Icon
            name={vehicleIcon}
            size={30}
            color={COLORS.primary}
          />
        </View>

        {/* Vehicle Information */}
        <View style={styles.vehicleInfoCol}>
          <View style={styles.vehicleTitleRow}>
            <Text style={styles.vehicleNameText}>
              {selectedRide.name || 'Moto Ride'}
            </Text>
          </View>

          <Text numberOfLines={1} style={styles.vehicleDescText}>
            {selectedRide.description || 'Fast & reliable doorstep ride'}
          </Text>

          {/* Badges / Chips */}
          <View style={styles.badgesRow}>
            <View style={styles.etaBadge}>
              <Icon name="clock" size={11} color={COLORS.secondPrimary} />
              <Text style={styles.etaBadgeText}>
                {selectedRide.eta || '3-5 mins away'}
              </Text>
            </View>

            <View style={styles.capacityBadge}>
              <Icon name="user" size={11} color={COLORS.textLight} />
              <Text style={styles.capacityBadgeText}>{capacityLabel}</Text>
            </View>
          </View>
        </View>

        {/* Price / Fare Column */}
        <View style={styles.priceCol}>
          <Text style={styles.fareAmountText}>{formatCurrency(totalFare)}</Text>
          <Text style={styles.fareSubText}>
            {t('rider.estimatedTotal', 'Fixed Fare')}
          </Text>
        </View>
      </View>

      {/* Bottom Perks Strip */}
      <View style={styles.perksDivider} />
      <View style={styles.perksRow}>
        <View style={styles.perkItem}>
          <Icon name="shield" size={14} color={COLORS.primary} />
          <Text style={styles.perkText}>Verified Drivers</Text>
        </View>
        <View style={styles.perkDot} />
        <View style={styles.perkItem}>
          <Icon name="location-pin" size={14} color={COLORS.secondPrimary} />
          <Text style={styles.perkText}>Live GPS Tracking</Text>
        </View>
        <View style={styles.perkDot} />
        <View style={styles.perkItem}>
          <Icon name="check-circle" size={14} color={COLORS.success} />
          <Text style={styles.perkText}>No Hidden Fees</Text>
        </View>
      </View>
    </View>
  );

  // 3. CONFIRM BUTTON (Clear, Ergonomic, Actionable)
  const confirmButton = (
    <View style={styles.actionContainer}>
      <CustomButton
        title={`${t('rider.confirmAndRequest', 'Confirm & Request')} ${selectedRide.name || 'Ride'}`}
        onPress={handleConfirm}
        variant="primary"
        icon="arrow-right"
        iconPosition="right"
        loading={isBooking}
        disabled={isBooking}
        style={styles.confirmBtn}
      />
      <Text style={styles.safetyGuaranteeText}>
        {t('rider.payAfterRide', 'Pay upon ride completion • Cash or Online')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ResponsiveContainer maxWidth={680} style={{ flex: 1 }}>
        <Header
          title={t('rider.confirmRide', 'Confirm Ride')}
          onBack={() => navigation.goBack()}
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + SPACING.lg, SPACING.xxl) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {routeCard}
          {vehicleCard}
          {confirmButton}
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
    gap: SPACING.md,
  },

  // Generic Card Container
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    borderWidth: 1.5,
    borderColor: '#ECEFF1',
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  // Route Card Header
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardHeaderTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.textLight,
    letterSpacing: 0.8,
  },
  tripMetaBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.round,
  },
  tripMetaText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },

  // Route Item Rows
  routeItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pickupIndicatorContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  pickupOuterRing: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },

  connectorContainer: {
    width: 24,
    alignItems: 'center',
    marginVertical: 2,
  },
  connectorLine: {
    width: 2,
    height: 24,
    backgroundColor: '#CFD8DC',
    borderRadius: 1,
  },

  dropIndicatorContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  dropSquare: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.secondPrimary,
    backgroundColor: COLORS.secondPrimaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 1,
    backgroundColor: COLORS.secondPrimary,
  },

  routeTextCol: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  routeSublabel: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(11),
    fontWeight: '700',
    color: COLORS.textLight,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  routeAddressText: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: responsiveFont(14),
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: Math.round(responsiveFont(14) * 1.4),
  },

  // Vehicle Card Layout
  vehicleMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleAvatarBox: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  vehicleInfoCol: {
    flex: 1,
  },
  vehicleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleNameText: {
    ...TYPOGRAPHY.title,
    fontSize: responsiveFont(17),
    fontWeight: '800',
    color: COLORS.text,
  },
  vehicleDescText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondPrimaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.round,
    gap: 4,
  },
  etaBadgeText: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(11),
    fontWeight: '700',
    color: COLORS.secondPrimaryDark,
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.round,
    gap: 4,
  },
  capacityBadgeText: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(11),
    fontWeight: '600',
    color: COLORS.text,
  },

  priceCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  fareAmountText: {
    ...TYPOGRAPHY.h2,
    fontSize: responsiveFont(22),
    fontWeight: '900',
    color: COLORS.text,
  },
  fareSubText: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(11),
    fontWeight: '600',
    color: COLORS.textLight,
    marginTop: 1,
  },

  perksDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  perksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  perkText: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(11),
    fontWeight: '600',
    color: COLORS.textLight,
  },
  perkDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
  },

  // Confirm Action Button
  actionContainer: {
    marginTop: SPACING.xs,
  },
  confirmBtn: {
    height: 56,
    borderRadius: RADIUS.large,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  safetyGuaranteeText: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(12),
    fontWeight: '500',
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});

export default ConfirmRideScreen;
