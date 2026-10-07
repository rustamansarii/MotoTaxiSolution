import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import RatingStars from '../../components/RatingStars';
import CustomButton from '../../components/CustomButton';
import ProfileAvatar from '../../components/ProfileAvatar';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useResponsive } from '../../utils/responsive';
import { ACTIVE_MOCK_DRIVER } from '../../data/mockDrivers';
import { clearRiderTripState } from '../../redux/features/rider/riderSlice';
import { resetActiveRideState, driverCompleteTrip } from '../../redux/features/driver/driverSlice';
import { apiPost } from '../../utils/apiClient';
import ApiConstant from '../../utils/apiConstant';

export const RatingScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { insets } = useResponsive();

  const isDriver = route.params?.isDriver ?? false;
  const passengerName =
    route.params?.passengerName ||
    route.params?.riderName ||
    'Passenger';

  const riderState = useSelector((state) => state.rider);
  const driverState = useSelector((state) => state.driver);
  const completedTrip = riderState?.completedTrip;
  const activeRide = driverState?.completedRide || driverState?.activeRide;

  const driver =
    route.params?.driver ||
    completedTrip?.driver ||
    riderState?.driverDetails ||
    ACTIVE_MOCK_DRIVER;

  const rideId =
    route.params?.ride_id ||
    route.params?.rideId ||
    (isDriver ? activeRide?.ride_id : completedTrip?.ride_id) ||
    riderState?.activeRideId ||
    route.params?.driver?.ride_id;

  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);

  const getRatingDescriptor = (stars) => {
    if (isDriver) {
      if (stars === 5) return t('driver.ratingExcellent', 'Excellent passenger!');
      if (stars >= 4) return t('driver.ratingGood', 'Good passenger');
      if (stars >= 3) return t('driver.ratingAverage', 'Average trip');
      return t('driver.ratingPoor', 'Could be better');
    }
    if (stars === 5) return t('rider.ratingExcellent', 'Excellent experience!');
    if (stars >= 4) return t('rider.ratingGood', 'Very good ride');
    if (stars >= 3) return t('rider.ratingAverage', 'Average trip');
    return t('rider.ratingPoor', 'Could be better');
  };

  const handleSubmit = async () => {
    setLoading(true);
    const targetRideId = rideId ? Number(rideId) : null;

    try {
      if (targetRideId) {
        const payload = {
          ride_id: targetRideId,
          stars: Number(rating),
        };

        const endpoint = ApiConstant.RateRide
          ? ApiConstant.RateRide(targetRideId)
          : `rides/${targetRideId}/rate/`;

        console.log(`[RatingScreen] Submitting rating for ride #${targetRideId} (isDriver: ${isDriver}):`, payload);
        await apiPost(endpoint, payload);
      } else {
        console.warn('[RatingScreen] Cannot submit rating: ride_id is missing');
      }
    } catch (err) {
      console.warn('[RatingScreen] Failed to submit rate:', err);
    } finally {
      setLoading(false);
      if (isDriver) {
        if (targetRideId) {
          dispatch(driverCompleteTrip({ rideId: targetRideId }));
        }
        dispatch(resetActiveRideState());
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'DriverTabs',
              params: { screen: 'DriverHome' },
            },
          ],
        });
      } else {
        dispatch(clearRiderTripState());
        if (navigation.canGoBack()) {
          navigation.popToTop();
        } else {
          navigation.navigate('RiderTabs', { screen: 'RiderHome' });
        }
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ResponsiveContainer maxWidth={540} style={{ flex: 1 }}>
        <Header
          title={isDriver ? t('driver.ratePassenger', 'Rate Passenger') : t('rider.rateDriver', 'Rate Your Driver')}
          showBack={false}
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + SPACING.lg, SPACING.xxxl) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Section */}
          <View style={styles.driverSection}>
            <ProfileAvatar name={isDriver ? passengerName : (driver?.name || 'Driver')} size={72} />
            <Text style={styles.driverName}>{isDriver ? passengerName : (driver?.name || 'Driver')}</Text>
            <Text style={styles.carInfo}>
              {isDriver
                ? t('driver.passengerMotoTaxi', 'Passenger • Moto Taxi')
                : `${driver?.car?.model || driver?.vehicle_model || driver?.vehicle || 'Moto Taxi'} • ${driver?.car?.plateNumber || driver?.vehicle_plate || ''}`}
            </Text>
          </View>

          {/* Star Rating Section */}
          <View style={styles.starsCard}>
            <Text style={styles.rateQuestion}>
              {isDriver ? t('driver.howWasPassenger', 'How was your passenger?') : t('rider.howWasTrip', 'How was your experience?')}
            </Text>
            <RatingStars
              rating={rating}
              size={36}
              interactive={true}
              onRatingChange={setRating}
              style={styles.starsRow}
            />
            <Text style={styles.ratingDescriptor}>
              {getRatingDescriptor(rating)}
            </Text>
          </View>

          {/* Submit Button */}
          <CustomButton
            title={isDriver ? t('driver.submitRating', 'Submit Rating & Go Online') : t('rider.submitRating', 'Submit Rating')}
            onPress={handleSubmit}
            loading={loading}
            variant="primary"
            style={styles.submitBtn}
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
    paddingBottom: SPACING.xxxl,
  },
  driverSection: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  driverName: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  carInfo: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  starsCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  rateQuestion: {
    ...TYPOGRAPHY.title,
    fontWeight: '700',
    color: COLORS.text,
  },
  starsRow: {
    marginVertical: SPACING.md,
  },
  ratingDescriptor: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.secondPrimary,
  },
  submitBtn: {
    marginTop: SPACING.md,
  },
});

export default RatingScreen;