import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import Icon from '../../components/Icon';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '../../utils/responsive';
import { formatCurrency } from '../../utils/formatters';
import { MOCK_RIDES } from '../../data/mockRides';
import { MOCK_PAYMENT_METHODS } from '../../data/mockTransactions';
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
  const { isSplitLayout, insets } = useResponsive();
  const dispatch = useDispatch();

  const { isBooking } = useSelector((state) => state.rides);

  const selectedRide = route.params?.selectedRide || MOCK_RIDES[0];
  const pickup = route.params?.pickup || '5th Ave & 58th St';
  const destination = route.params?.destination || 'JFK International Airport';

  const [paymentMethod, setPaymentMethod] = useState(
    route.params?.paymentMethod || MOCK_PAYMENT_METHODS[0]
  );
  const [promoCode, setPromoCode] = useState('MOTOTAXI20');
  const [promoApplied, setPromoApplied] = useState(true);

  const baseFare = selectedRide.price;
  const discount = promoApplied ? 4.5 : 0;
  const bookingFee = 2.0;
  const totalFare = Math.max(0, baseFare + bookingFee - discount);

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

    const vehicleType =
      selectedRide?.vehicle_type ||
      (selectedRide?.name?.toUpperCase().includes('CAR') || selectedRide?.name?.toUpperCase().includes('CAB')
        ? 'CAR'
        : selectedRide?.name?.toUpperCase().includes('AUTO')
        ? 'AUTO'
        : 'BIKE');

    const bookingPayload = {
      pickup_lat: pLat,
      pickup_lon: pLon,
      pickup_address: pickup || 'Elante Mall, Chandigarh',
      drop_lat: dLat,
      drop_lon: dLon,
      drop_address: destination || 'Sector 17, Chandigarh',
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
      });
    }
  };

  const routeCard = (
    <View style={styles.card}>
      <Text style={styles.cardHeader}>{t('rider.tripRoute')}</Text>
      <View style={styles.routeRow}>
        <View style={styles.dotPickup} />
        <View style={styles.routeDetails}>
          <Text style={styles.routeLabel}>{t('rider.pickup')}</Text>
          <Text numberOfLines={1} style={styles.routeAddress}>
            {pickup}
          </Text>
        </View>
      </View>

      <View style={styles.routeConnector} />

      <View style={styles.routeRow}>
        <View style={styles.squareDest} />
        <View style={styles.routeDetails}>
          <Text style={styles.routeLabel}>{t('rider.destination')}</Text>
          <Text numberOfLines={1} style={styles.routeAddress}>
            {destination}
          </Text>
        </View>
      </View>
    </View>
  );

  const vehicleCard = (
    <View style={styles.vehicleOverviewCard}>
      <View style={styles.vehicleIconCircle}>
        <Icon
          name={selectedRide.iconType || selectedRide.icon || 'bike'}
          size={26}
          color={COLORS.secondPrimary}
        />
      </View>
      <View style={styles.vehicleDetailsCol}>
        <Text style={styles.vehicleName}>{selectedRide.name}</Text>
        <Text style={styles.vehicleDesc}>{selectedRide.description}</Text>
      </View>
      <View style={styles.vehicleEtaBadge}>
        <Text style={styles.vehicleEtaText}>{selectedRide.eta}</Text>
      </View>
    </View>
  );

  const promoSection = (
    <View style={styles.promoSection}>
      <View style={styles.promoInputCol}>
        <CustomInput
          label={t('rider.promoCode')}
          value={promoCode}
          onChangeText={setPromoCode}
          placeholder={t('rider.promoPlaceholder')}
          leftIcon="tag"
          containerStyle={styles.noMargin}
        />
      </View>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setPromoApplied(!promoApplied)}
        style={[
          styles.applyBtn,
          promoApplied && styles.appliedBtn,
        ]}
      >
        {promoApplied ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.appliedBtnText}>{t('rider.applied')} </Text>
            <Icon name="check" size={12} color={COLORS.primary} />
          </View>
        ) : (
          <Text style={styles.applyBtnText}>{t('rider.apply')}</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const fareCard = (
    <View style={styles.card}>
      <Text style={styles.cardHeader}>{t('rider.fareBreakdown')}</Text>

      <View style={styles.fareRow}>
        <Text style={styles.fareLabel}>{t('rider.tripFare')} ({selectedRide.name})</Text>
        <Text style={styles.fareValue}>{formatCurrency(baseFare)}</Text>
      </View>

      <View style={styles.fareRow}>
        <Text style={styles.fareLabel}>{t('rider.bookingFee')}</Text>
        <Text style={styles.fareValue}>{formatCurrency(bookingFee)}</Text>
      </View>

      {promoApplied && (
        <View style={styles.fareRow}>
          <Text style={[styles.fareLabel, styles.discountText]}>
            {t('rider.promoDiscount')}
          </Text>
          <Text style={[styles.fareValue, styles.discountText]}>
            -{formatCurrency(discount)}
          </Text>
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>{t('rider.estimatedTotal')}</Text>
        <Text style={styles.totalValue}>{formatCurrency(totalFare)}</Text>
      </View>
    </View>
  );

  const paymentCard = (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => navigation.navigate('RiderTabs', { screen: 'Wallet' })}
      style={styles.paymentCard}
    >
      <View style={styles.paymentIconBox}>
        <Icon name="apple" size={20} color={COLORS.text} />
      </View>
      <View style={styles.paymentInfo}>
        <Text style={styles.paymentTitle}>{paymentMethod.name}</Text>
        <Text style={styles.paymentSubtitle}>{t('rider.tapToChangePayment')}</Text>
      </View>
      <Icon name="chevron-right" size={18} color={COLORS.iconLight} />
    </TouchableOpacity>
  );

  const confirmButton = (
    <CustomButton
      title={`${t('rider.confirmAndRequest')} ${selectedRide.name}`}
      onPress={handleConfirm}
      variant="primary"
      icon="arrow-right"
      iconPosition="right"
      loading={isBooking}
      disabled={isBooking}
      style={styles.confirmButton}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ResponsiveContainer maxWidth={960} style={{ flex: 1 }}>
        <Header
          title={t('rider.confirmRide')}
          onBack={() => navigation.goBack()}
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + SPACING.lg, SPACING.xxxl) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {isSplitLayout ? (
            <View style={styles.splitColumnsRow}>
              <View style={styles.splitColumn}>
                {routeCard}
                {vehicleCard}
              </View>
              <View style={styles.splitColumn}>
                {promoSection}
                {fareCard}
                {paymentCard}
                {confirmButton}
              </View>
            </View>
          ) : (
            <>
              {routeCard}
              {vehicleCard}
              {promoSection}
              {fareCard}
              {paymentCard}
              {confirmButton}
            </>
          )}
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
    paddingBottom: SPACING.xxxl,
  },
  splitColumnsRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    alignItems: 'flex-start',
  },
  splitColumn: {
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.large,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotPickup: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.md,
  },
  squareDest: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: COLORS.secondPrimary,
    marginRight: SPACING.md,
  },
  routeConnector: {
    width: 2,
    height: 18,
    backgroundColor: COLORS.border,
    marginLeft: 4,
    marginVertical: 2,
  },
  routeDetails: {
    flex: 1,
  },
  routeLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  routeAddress: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  vehicleOverviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  vehicleIconCircle: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  vehicleDetailsCol: {
    flex: 1,
  },
  vehicleName: {
    ...TYPOGRAPHY.title,
    fontWeight: '700',
    color: COLORS.text,
  },
  vehicleDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  vehicleEtaBadge: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.small,
  },
  vehicleEtaText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.secondPrimary,
  },
  promoSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  promoInputCol: {
    flex: 1,
  },
  noMargin: {
    marginBottom: 0,
  },
  applyBtn: {
    height: 54,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.secondPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appliedBtn: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  applyBtnText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.white,
  },
  appliedBtnText: {
    color: COLORS.primaryDark,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  fareLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textLight,
  },
  fareValue: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.text,
  },
  discountText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  totalLabel: {
    ...TYPOGRAPHY.title,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalValue: {
    ...TYPOGRAPHY.h2,
    fontWeight: '800',
    color: COLORS.text,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  paymentIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  paymentSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  confirmButton: {
    marginTop: SPACING.xs,
  },
});

export default ConfirmRideScreen;
