import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import { RidesRouteMap } from '../../components/navigation/RidesRouteMap';
import RideCard from '../../components/RideCard';
import Icon from '../../components/Icon';
import AdaptiveSplitView from '../../components/AdaptiveSplitView';
import { useResponsive, responsiveFont } from '../../utils/responsive';
import { formatDuration, formatCurrency } from '../../utils/formatters';
import { MOCK_RIDES } from '../../data/mockRides';
import { MOCK_PAYMENT_METHODS } from '../../data/mockTransactions';
import { useTranslation } from 'react-i18next';
import {
  fetchFareEstimate,
  setSelectedRide as setReduxSelectedRide,
} from '../../redux/features/rides/ridesSlice';

export const RideOptionsScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { isSplitLayout, insets } = useResponsive();
  const dispatch = useDispatch();

  const pickup = route.params?.pickup || 'Pickup Location';
  const destination = route.params?.destination || 'Destination';

  // Redux rides state
  const {
    estimate,
    availableRides,
    selectedRide: reduxSelectedRide,
    isLoadingFares,
    fareError,
  } = useSelector((state) => state.rides);

  // Redux location state
  const {
    currentCoords,
    pickupLocation,
    dropoffLocation,
  } = useSelector((state) => state.location);

  // Extract coordinates for fare estimate API
  const pickupLat =
    route.params?.pickup_lat ??
    route.params?.pickupData?.latitude ??
    route.params?.pickupData?.lat ??
    pickupLocation?.latitude ??
    pickupLocation?.lat ??
    currentCoords?.latitude ??
    30.6946309;

  const pickupLon =
    route.params?.pickup_lon ??
    route.params?.pickupData?.longitude ??
    route.params?.pickupData?.lon ??
    pickupLocation?.longitude ??
    pickupLocation?.lon ??
    currentCoords?.longitude ??
    76.7834118;

  const dropLat =
    route.params?.drop_lat ??
    route.params?.destinationData?.latitude ??
    route.params?.destinationData?.lat ??
    dropoffLocation?.latitude ??
    dropoffLocation?.lat ??
    30.9090157;

  const dropLon =
    route.params?.drop_lon ??
    route.params?.destinationData?.longitude ??
    route.params?.destinationData?.lon ??
    dropoffLocation?.longitude ??
    dropoffLocation?.lon ??
    75.851601;

  // Local selection fallback
  const [localSelectedRide, setLocalSelectedRide] = useState(null);

  // Default payment method: platform-aware
  const defaultPayment = useMemo(() => {
    if (Platform.OS === 'ios') {
      return MOCK_PAYMENT_METHODS[0]; // Apple Pay
    }
    // On Android, prefer Cash or Card
    return (
      MOCK_PAYMENT_METHODS.find((p) => p.type === 'cash') ||
      MOCK_PAYMENT_METHODS[1] ||
      MOCK_PAYMENT_METHODS[0]
    );
  }, []);

  const [paymentMethod, setPaymentMethod] = useState(defaultPayment);

  // Fetch Fare Estimate API
  const loadFares = useCallback(() => {
    if (pickupLat && pickupLon && dropLat && dropLon) {
      dispatch(
        fetchFareEstimate({
          pickup_lat: pickupLat,
          pickup_lon: pickupLon,
          drop_lat: dropLat,
          drop_lon: dropLon,
        })
      );
    }
  }, [dispatch, pickupLat, pickupLon, dropLat, dropLon]);

  useEffect(() => {
    loadFares();
  }, [loadFares]);

  // Use dynamic rides from API or fall back to MOCK_RIDES
  const displayRides = availableRides.length > 0 ? availableRides : MOCK_RIDES;

  // Selected ride priority: local selection -> redux selection -> first ride
  const currentSelectedRide =
    localSelectedRide ||
    reduxSelectedRide ||
    displayRides[0];

  const handleSelectRide = (ride) => {
    setLocalSelectedRide(ride);
    dispatch(setReduxSelectedRide(ride));
  };

  const handleProceed = () => {
    navigation.navigate('ConfirmRide', {
      selectedRide: currentSelectedRide,
      pickup,
      destination,
      paymentMethod,
      fareEstimate: estimate,
      pickup_lat: pickupLat,
      pickup_lon: pickupLon,
      pickup_address: pickup,
      drop_lat: dropLat,
      drop_lon: dropLon,
      drop_address: destination,
      vehicle_type: currentSelectedRide?.vehicle_type || 'CAR',
    });
  };

  // Map Pane with floating circular back button and floating route pill
  const mapPane = (
    <View style={styles.mapContainer}>
      <RidesRouteMap
        pickupCoords={[pickupLon, pickupLat]}
        dropCoords={[dropLon, dropLat]}
        pickupLabel={pickup}
        destinationLabel={destination}
        distanceKm={estimate?.distance_km || 92.1}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Floating Top Bar (Uber / Lyft style) */}
      <View style={[styles.floatingTopBar, { top: Math.max(insets.top + 8, 16) }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
          style={styles.floatingBackBtn}
        >
          <Icon name="arrow-left" size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.floatingTitlePill}>
          <Text numberOfLines={1} style={styles.floatingTitleText}>
            {t('rider.availableRides', 'Available Rides')}
          </Text>
        </View>

        <View style={styles.placeholderRight} />
      </View>
    </View>
  );

  // Bottom Options Sheet
  const optionsPane = (
    <View
      style={[
        styles.bottomSheet,
        isSplitLayout && styles.sideSheet,
        { paddingBottom: Math.max(insets.bottom + 8, 16) },
      ]}
    >
      {/* Drag Handle */}
      {!isSplitLayout && <View style={styles.sheetHandle} />}

      {/* Compact Horizontal Trip Stats Row */}
      <View style={styles.tripMetaRow}>
        {estimate ? (
          <View style={styles.tripChip}>
            <Icon name="navigation" size={12} color={COLORS.primary} />
            <Text style={styles.tripChipValue}>
              {estimate.distance_km ? `${Number(estimate.distance_km).toFixed(1)} km` : '--'}
            </Text>
            <Text style={styles.tripChipDot}>•</Text>
            <Icon name="clock" size={12} color={COLORS.secondPrimary} />
            <Text style={styles.tripChipValue}>
              {estimate.duration_min ? formatDuration(estimate.duration_min) : '--'}
            </Text>
          </View>
        ) : (
          <View style={styles.tripChip}>
            <Text style={styles.tripChipValue}>
              {t('rider.availableRides', 'Select a Category')}
            </Text>
          </View>
        )}

        {isLoadingFares && (
          <View style={styles.liveEstimatingBadge}>
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 5 }} />
            <Text style={styles.liveEstimatingText}>
              {t('rider.updatingFares', 'Updating fares...')}
            </Text>
          </View>
        )}
      </View>

      {/* Error banner with retry if API failed */}
      {fareError && availableRides.length === 0 && (
        <View style={styles.errorBanner}>
          <Icon name="alert-circle" size={15} color={COLORS.danger} />
          <Text style={styles.errorText} numberOfLines={1}>
            {fareError}
          </Text>
          <TouchableOpacity onPress={loadFares} style={styles.retryBtn}>
            <Text style={styles.retryText}>{t('common.retry', 'Retry')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Category List ScrollView */}
      <ScrollView
        style={styles.ridesScroll}
        contentContainerStyle={styles.ridesListContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoadingFares && availableRides.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.fullLoadingText}>
              {t('rider.calculatingFares', 'Calculating accurate fare estimate...')}
            </Text>
          </View>
        ) : (
          displayRides.map((ride) => (
            <RideCard
              key={ride.id}
              ride={ride}
              isSelected={currentSelectedRide?.id === ride.id}
              onSelect={handleSelectRide}
            />
          ))
        )}
      </ScrollView>
      {/* Confirm CTA Button with Price Badge */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handleProceed}
        disabled={isLoadingFares && availableRides.length === 0}
        style={[
          styles.confirmBtn,
          isLoadingFares && availableRides.length === 0 && styles.confirmBtnDisabled,
        ]}
      >
        <Text numberOfLines={1} style={styles.confirmBtnText}>
          {`${t('common.confirm', 'Confirm')} ${currentSelectedRide?.name || 'Ride'}`}
        </Text>
        {currentSelectedRide?.price ? (
          <View style={styles.btnPriceBadge}>
            <Text style={styles.btnPriceText}>
              {formatCurrency(
                currentSelectedRide.price,
                currentSelectedRide.currency === 'INR' ? '₹' : '$'
              )}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      <AdaptiveSplitView
        primaryPane={mapPane}
        secondaryPane={optionsPane}
        primaryRatio={0.38}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mapContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  floatingTopBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  floatingBackBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  floatingTitlePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.round,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  floatingTitleText: {
    fontSize: responsiveFont(14),
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  placeholderRight: {
    width: 42,
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  sideSheet: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderLeftWidth: 1,
    borderTopWidth: 0,
    paddingTop: 16,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 8,
  },
  tripMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tripChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.round,
  },
  tripChipValue: {
    fontSize: responsiveFont(12),
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 4,
  },
  tripChipDot: {
    fontSize: responsiveFont(12),
    color: '#94A3B8',
    marginHorizontal: 6,
  },
  liveEstimatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(23, 186, 161, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
  },
  liveEstimatingText: {
    fontSize: responsiveFont(11),
    fontWeight: '600',
    color: COLORS.primary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.small,
    marginBottom: 6,
  },
  errorText: {
    fontSize: responsiveFont(11),
    color: COLORS.danger,
    flex: 1,
    marginLeft: 6,
  },
  retryBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#FEE2E2',
    borderRadius: RADIUS.small,
    marginLeft: 6,
  },
  retryText: {
    fontSize: responsiveFont(11),
    fontWeight: '700',
    color: COLORS.danger,
  },
  ridesScroll: {
    flex: 1,
  },
  ridesListContent: {
    paddingBottom: 6,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullLoadingText: {
    fontSize: responsiveFont(13),
    color: '#64748B',
    marginTop: 10,
  },
  paymentSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADIUS.medium,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  paymentText: {
    fontSize: responsiveFont(13),
    fontWeight: '600',
    color: '#0F172A',
  },
  paymentRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changePaymentText: {
    fontSize: responsiveFont(12),
    fontWeight: '600',
    color: '#64748B',
    marginRight: 2,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmBtnText: {
    fontSize: responsiveFont(16),
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: -0.2,
  },
  btnPriceBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.small,
    marginLeft: 8,
  },
  btnPriceText: {
    fontSize: responsiveFont(14),
    fontWeight: '800',
    color: COLORS.white,
  },
});

export default RideOptionsScreen;
