import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import RatingStars from '../../components/RatingStars';
import CustomButton from '../../components/CustomButton';
import Icon from '../../components/Icon';
import { formatCurrency } from '../../utils/formatters';

export const DriverTripCompletedScreen = ({ navigation, route }) => {
  const fare = route.params?.fare || 28.5;
  const passengerName = route.params?.passengerName || 'Elena Rostova';
  const distance = route.params?.distance || '16.4 mi';
  const duration = route.params?.duration || '32 mins';

  const [rating, setRating] = useState(5);
  const surgeBonus = 3.5;
  const tipBonus = 5.0;
  const totalEarned = fare + surgeBonus + tipBonus;

  const handleFinish = () => {
    navigation.navigate('DriverHome');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.backgroundglass} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.checkCircle}>
          <Icon name="check" size={36} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Trip Completed!</Text>
        <Text style={styles.subtitle}>
          Your earnings have been added to your daily wallet.
        </Text>

        {/* Total Earned Card */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Total Earned</Text>
          <Text style={styles.earningsAmount}>
            {formatCurrency(totalEarned)}
          </Text>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Base Ride Fare</Text>
            <Text style={styles.breakdownVal}>{formatCurrency(fare)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Surge Zone Bonus</Text>
            <Text style={styles.surgeVal}>+{formatCurrency(surgeBonus)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Passenger Tip</Text>
            <Text style={styles.tipVal}>+{formatCurrency(tipBonus)}</Text>
          </View>
        </View>

        {/* Trip Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statNum}>{distance}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statNum}>{duration}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statNum}>Comfort</Text>
            <Text style={styles.statLabel}>Category</Text>
          </View>
        </View>

        {/* Rate Rider Card */}
        <View style={styles.rateCard}>
          <Text style={styles.rateTitle}>Rate Passenger</Text>
          <Text style={styles.rateSubtitle}>
            How was your experience driving {passengerName}?
          </Text>

          <RatingStars
            rating={rating}
            size={34}
            interactive={true}
            onRatingChange={setRating}
            style={styles.stars}
          />
        </View>

        {/* Action Button */}
        <CustomButton
          title="Ready for Next Ride"
          onPress={handleFinish}
          variant="primary"
          icon="arrow-right"
          iconPosition="right"
          style={styles.nextBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundglass,
  },
  content: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    alignItems: 'center',
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.secondBackgroundglass,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h2,
    fontWeight: '800',
    color: COLORS.white,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: SPACING.xl,
  },
  earningsCard: {
    width: '100%',
    backgroundColor: COLORS.secondBackgroundglass,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: SPACING.md,
  },
  earningsLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  earningsAmount: {
    ...TYPOGRAPHY.h1,
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginVertical: SPACING.xs,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  breakdownLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textLight,
  },
  breakdownVal: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.white,
  },
  surgeVal: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.primary,
  },
  tipVal: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statsCard: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: COLORS.secondBackgroundglass,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.white,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.backgroundglass,
    height: '70%',
    alignSelf: 'center',
  },
  rateCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  rateTitle: {
    ...TYPOGRAPHY.title,
    fontWeight: '700',
    color: COLORS.text,
  },
  rateSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  stars: {
    marginVertical: SPACING.md,
  },
  nextBtn: {
    width: '100%',
  },
});

export default DriverTripCompletedScreen;
