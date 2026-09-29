import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { KeyboardTextInput } from '../../components/keyboard/KeyboardTextInput';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import { RidesRouteMap } from '../../components/navigation';
import CustomButton from '../../components/CustomButton';
import Icon from '../../components/Icon';
import AdaptiveSplitView from '../../components/AdaptiveSplitView';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '../../utils/responsive';
import {
  driverStartTrip,
  sendDriverLocationUpdate,
  clearActionNotices,
} from '../../redux/features/driver/driverSlice';

export const DriverArrivedScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { isSplitLayout, insets } = useResponsive();
  const dispatch = useDispatch();

  const {
    rideStatus,
    rideCancelledNotice,
    actionError,
    actionLoading,
    activeRide,
  } = useSelector((state) => state.driver);

  const rideId =
    route.params?.ride_id ||
    route.params?.tripId ||
    activeRide?.ride_id ||
    1;
  const pickup =
    route.params?.pickup ||
    activeRide?.pickup_address ||
    activeRide?.pickup ||
    'Pickup Location';
  const destination =
    route.params?.destination ||
    activeRide?.drop_address ||
    activeRide?.destination_address ||
    activeRide?.destination ||
    'Destination';
  const passengerName =
    route.params?.passengerName ||
    activeRide?.rider_name ||
    activeRide?.passengerName ||
    'Rider';
  const estimatedFare =
    route.params?.estimatedFare ??
    activeRide?.driver_payout ??
    activeRide?.fare ??
    28.5;
  const currency =
    route.params?.currency ||
    activeRide?.currency ||
    'USD';
  const tripDistance =
    route.params?.tripDistance ||
    (activeRide?.distance_km !== undefined
      ? `${activeRide.distance_km} km`
      : '16.4 mi');

  const pickupCoords = useMemo(() => {
    if (route.params?.pickupCoordinates && route.params.pickupCoordinates.length === 2) {
      return [Number(route.params.pickupCoordinates[0]), Number(route.params.pickupCoordinates[1])];
    }
    const pLon = route.params?.pickup_lon ?? activeRide?.pickup_lon;
    const pLat = route.params?.pickup_lat ?? activeRide?.pickup_lat;
    if (pLon && pLat) {
      return [Number(pLon), Number(pLat)];
    }
    return [76.7835809, 30.6948328];
  }, [route.params, activeRide]);

  const dropCoords = useMemo(() => {
    if (route.params?.dropCoordinates && route.params.dropCoordinates.length === 2) {
      return [Number(route.params.dropCoordinates[0]), Number(route.params.dropCoordinates[1])];
    }
    const dLon = route.params?.drop_lon ?? activeRide?.drop_lon;
    const dLat = route.params?.drop_lat ?? activeRide?.drop_lat;
    if (dLon && dLat) {
      return [Number(dLon), Number(dLat)];
    }
    return [75.8573, 30.9005];
  }, [route.params, activeRide]);

  const numDistanceKm = useMemo(() => {
    const raw = route.params?.distance_km ?? activeRide?.distance_km;
    if (raw !== undefined && raw !== null) return Number(raw);
    const parsed = parseFloat(String(tripDistance).replace(/[^\d.]/g, ''));
    return !isNaN(parsed) && parsed > 0 ? parsed : 91.56;
  }, [route.params, activeRide, tripDistance]);

  const [waitTimer, setWaitTimer] = useState(300); // 5 mins in seconds
  const [enteredPin, setEnteredPin] = useState('');
  const inputRef = useRef(null);

  // Send periodic location heartbeat at pickup (every 10 seconds)
  useEffect(() => {
    const lat = pickupCoords[1];
    const lng = pickupCoords[0];
    const interval = setInterval(() => {
      dispatch(sendDriverLocationUpdate({ lat, lng }));
    }, 10000);
    return () => clearInterval(interval);
  }, [dispatch, pickupCoords]);

  useEffect(() => {
    if (waitTimer <= 0) return;
    const interval = setInterval(() => setWaitTimer((sec) => sec - 1), 1000);
    return () => clearInterval(interval);
  }, [waitTimer]);

  // Listen for rider cancellation
  useEffect(() => {
    if (rideCancelledNotice) {
      Alert.alert('Ride Cancelled', 'The rider has cancelled this ride.');
      dispatch(clearActionNotices());
      if (navigation.canGoBack()) {
        navigation.popToTop();
      } else {
        navigation.navigate('DriverTabs', { screen: 'DriverHome' });
      }
    }
  }, [rideCancelledNotice, dispatch, navigation]);

  const hasNavigatedRef = useRef(false);

  const navigateToTrip = useCallback(() => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    navigation.replace('DriverTrip', {
      ride_id: rideId,
      pickup,
      destination,
      passengerName,
      estimatedFare,
      currency,
      tripDistance,
      pickupCoordinates: pickupCoords,
      dropCoordinates: dropCoords,
      distance_km: numDistanceKm,
    });
  }, [
    rideId,
    pickup,
    destination,
    passengerName,
    estimatedFare,
    currency,
    tripDistance,
    pickupCoords,
    dropCoords,
    numDistanceKm,
    navigation,
  ]);

  // Listen for start_trip_success from server
  useEffect(() => {
    if (rideStatus === 'in_progress') {
      navigateToTrip();
    }
  }, [rideStatus, navigateToTrip]);

  useEffect(() => {
    if (actionError) {
      Alert.alert('OTP Verification Failed', actionError);
      dispatch(clearActionNotices());
    }
  }, [actionError, dispatch]);

  const formatWait = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleStartTrip = () => {
    if (enteredPin.length < 4) {
      Alert.alert('Invalid OTP', 'Please enter the 4-digit OTP provided by the rider.');
      return;
    }
    dispatch(driverStartTrip({ rideId, otp: enteredPin }));
  };

  const handleKeypadPress = (val) => {
    if (val === 'C') {
      setEnteredPin('');
    } else if (val === 'DEL') {
      setEnteredPin((prev) => prev.slice(0, -1));
    } else {
      if (enteredPin.length < 4) {
        setEnteredPin((prev) => prev + val);
      }
    }
  };

  const mapPane = (
    <View style={isSplitLayout ? styles.mapAreaSplit : styles.mapArea}>
      <RidesRouteMap
        pickupCoords={pickupCoords}
        dropCoords={dropCoords}
        pickupLabel="Pickup (Arrived)"
        destinationLabel={destination}
        distanceKm={numDistanceKm}
        style={{ flex: 1, width: '100%', height: '100%' }}
      />

      {/* Floating Wait Timer */}
      <View
        style={[
          styles.waitBadge,
          { top: Math.max(insets.top + 10, 30) },
        ]}
      >
        <Icon name="clock" size={16} color={COLORS.primary} />
        <Text style={styles.waitText}>
          Waiting for rider: {formatWait(waitTimer)}
        </Text>
      </View>
    </View>
  );

  const pinSheetPane = (
    <ScrollView
      style={[
        styles.sheet,
        isSplitLayout && styles.sideSheet,
      ]}
      contentContainerStyle={[
        styles.sheetContent,
        !isSplitLayout && {
          paddingBottom: Math.max(insets.bottom + SPACING.lg, SPACING.xl),
        },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Rider Notified of Arrival</Text>
        <Text style={styles.subtitle}>
          Ask {passengerName} for their 4-digit ride OTP (visible on their phone screen) before departing.
        </Text>
      </View>

      {/* OTP Inputs with Touch to Focus */}
      <View style={styles.pinSection}>
        <Text style={styles.pinLabel}>ENTER RIDER OTP</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => inputRef.current?.focus()}
          style={styles.pinRow}
        >
          {[0, 1, 2, 3].map((idx) => {
            const digit = enteredPin[idx] || '';
            return (
              <View
                key={idx}
                style={[
                  styles.pinBox,
                  digit ? styles.pinBoxFilled : null,
                  enteredPin.length === idx ? styles.pinBoxActive : null,
                ]}
              >
                <Text style={styles.pinDigit}>{digit || '•'}</Text>
              </View>
            );
          })}
        </TouchableOpacity>

        {/* Transparent keyboard input over the area */}
        <KeyboardTextInput
          ref={inputRef}
          id="driver-pin-input"
          value={enteredPin}
          onChangeText={(val) => {
            if (val.length <= 4) setEnteredPin(val);
          }}
          keyboardType="number-pad"
          maxLength={4}
          autoFocus={false}
          style={styles.hiddenInput}
        />
      </View>

      {/* Large On-Screen Numeric Keypad for fast driver input */}
      <View style={styles.keypadGrid}>
        {[
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
          ['C', '0', '⌫'],
        ].map((row, rIdx) => (
          <View key={rIdx} style={styles.keypadRow}>
            {row.map((btn) => (
              <TouchableOpacity
                key={btn}
                activeOpacity={0.7}
                onPress={() =>
                  handleKeypadPress(btn === '⌫' ? 'DEL' : btn)
                }
                style={[
                  styles.keypadButton,
                  (btn === 'C' || btn === '⌫') && styles.keypadSpecial,
                ]}
              >
                <Text
                  style={[
                    styles.keypadText,
                    (btn === 'C' || btn === '⌫') && styles.keypadSpecialText,
                  ]}
                >
                  {btn}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* Start Trip CTA */}
      <CustomButton
        title={t('driver.startTrip', 'START TRIP').toUpperCase()}
        onPress={handleStartTrip}
        loading={actionLoading}
        disabled={enteredPin.length < 4}
        variant="primary"
        icon="navigation"
        iconPosition="right"
        style={styles.startBtn}
      />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <AdaptiveSplitView
        primaryPane={mapPane}
        secondaryPane={pinSheetPane}
        primaryRatio={0.48}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mapArea: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  mapAreaSplit: {
    flex: 1,
    height: '100%',
    position: 'relative',
  },
  waitBadge: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  waitText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: SPACING.xs,
  },
  sheet: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.extraLarge,
    borderTopRightRadius: RADIUS.extraLarge,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  sheetContent: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  sideSheet: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderLeftWidth: 1,
    borderTopWidth: 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 18,
    paddingHorizontal: SPACING.sm,
  },
  pinSection: {
    alignItems: 'center',
    marginVertical: SPACING.xs,
    position: 'relative',
  },
  pinLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.primaryDark,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  pinRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  pinBox: {
    width: 52,
    height: 56,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.inputBg,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBoxActive: {
    borderColor: COLORS.primaryDark,
  },
  pinBoxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  pinDigit: {
    ...TYPOGRAPHY.h2,
    fontWeight: '800',
    color: COLORS.text,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
  },
  keypadGrid: {
    width: '100%',
    maxWidth: 320,
    marginVertical: SPACING.sm,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  keypadButton: {
    flex: 1,
    height: 44,
    marginHorizontal: 4,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  keypadSpecial: {
    backgroundColor: COLORS.cardBackground,
  },
  keypadText: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '700',
    color: COLORS.text,
  },
  keypadSpecialText: {
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  startBtn: {
    width: '100%',
    maxWidth: 320,
    marginTop: SPACING.xs,
  },
});

export default DriverArrivedScreen;
