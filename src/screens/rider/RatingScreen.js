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
import { apiPost } from '../../utils/apiClient';
import ApiConstant from '../../utils/apiConstant';

export const RatingScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { insets } = useResponsive();

  const riderState = useSelector((state) => state.rider);
  const activeRideId = riderState?.activeRideId || riderState?.completedTrip?.ride_id;

  const driver = route.params?.driver || ACTIVE_MOCK_DRIVER;
  const rideId =
    route.params?.ride_id ||
    route.params?.rideId ||
    route.params?.driver?.ride_id ||
    route.params?.driver?.id ||
    activeRideId;

  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);

  const getRatingDescriptor = (stars) => {
    if (stars === 5) return t('rider.ratingExcellent', 'Excellent experience!');
    if (stars >= 4) return t('rider.ratingGood', 'Very good ride');
    if (stars >= 3) return t('rider.ratingAverage', 'Average trip');
    return t('rider.ratingPoor', 'Could be better');
  };

  const handleSubmit = async () => {
    setLoading(true);
    const targetRideId = rideId || 76;

    try {
      if (targetRideId) {
        const payload = {
          ride_id: Number(targetRideId),
          stars: Number(rating),
        };

        const endpoint = ApiConstant.RateRide
          ? ApiConstant.RateRide(targetRideId)
          : `rides/${targetRideId}/rate/`;

        await apiPost(endpoint, payload);
      }
    } catch (err) {
      console.warn('[RatingScreen] Failed to submit rate:', err);
    } finally {
      dispatch(clearRiderTripState());
      setLoading(false);
      if (navigation.canGoBack()) {
        navigation.popToTop();
      } else {
        navigation.navigate('RiderTabs', { screen: 'RiderHome' });
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ResponsiveContainer maxWidth={540} style={{ flex: 1 }}>
        <Header
          title={t('rider.rateDriver', 'Rate Your Driver')}
          showBack={false}
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + SPACING.lg, SPACING.xxxl) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Driver Profile */}
          <View style={styles.driverSection}>
            <ProfileAvatar name={driver.name} size={72} />
            <Text style={styles.driverName}>{driver.name}</Text>
            <Text style={styles.carInfo}>
              {driver.car?.model} • {driver.car?.plateNumber}
            </Text>
          </View>

          {/* Star Rating Section */}
          <View style={styles.starsCard}>
            <Text style={styles.rateQuestion}>{t('rider.howWasTrip', 'How was your experience?')}</Text>
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
            title={t('rider.submitRating', 'Submit Rating')}
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