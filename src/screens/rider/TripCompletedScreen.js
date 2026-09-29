import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import CustomButton from '../../components/CustomButton';
import Icon from '../../components/Icon';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '../../utils/responsive';
import { formatCurrency } from '../../utils/formatters';
import { ACTIVE_MOCK_DRIVER } from '../../data/mockDrivers';

export const TripCompletedScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { insets } = useResponsive();
  const driver = route.params?.driver || ACTIVE_MOCK_DRIVER;
  const totalFare = route.params?.totalFare || 18.5;
  const tripDistance = route.params?.tripDistance || '5.8 mi';
  const tripDuration = route.params?.tripDuration || '18 mins';
  const destination =
    route.params?.destination || 'JFK International Airport, Terminal 4';

  const handleRate = () => {
    navigation.navigate('Rating', {
      driver,
      totalFare,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <ResponsiveContainer maxWidth={560} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + SPACING.lg, SPACING.xxxl) },
          ]}
          showsVerticalScrollIndicator={false}
        >
        {/* Success Icon */}
        <View style={styles.successIconCircle}>
          <Icon name="check" size={36} color={COLORS.primary} />
        </View>

        <Text style={styles.successTitle}>{t('rider.tripCompleted')}</Text>
        <Text style={styles.successSubtitle}>
          Thanks for riding with {driver.name} on Moto Taxi.
        </Text>

        {/* Fare Highlight */}
        <View style={styles.fareHighlightCard}>
          <Text style={styles.farePaidLabel}>Total Paid</Text>
          <Text style={styles.fareAmount}>{formatCurrency(totalFare)}</Text>
          <View style={styles.paidMethodPill}>
            <Icon name="apple" size={14} color={COLORS.text} />
            <Text style={styles.paidMethodText}>Apple Pay • Charged</Text>
          </View>
        </View>

        {/* Trip Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{tripDistance}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{tripDuration}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>Clean</Text>
            <Text style={styles.statLabel}>Eco-Trip</Text>
          </View>
        </View>

        {/* Route Summary */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>{t('rider.destination')}</Text>
          <View style={styles.destinationRow}>
            <View style={styles.destSquare} />
            <Text numberOfLines={2} style={styles.destinationText}>
              {destination}
            </Text>
          </View>
        </View>

        {/* Driver Snapshot */}
        <View style={styles.driverCard}>
          <View style={styles.driverAvatar}>
            <Text style={styles.avatarInitials}>
              {driver.name.charAt(0)}
            </Text>
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{driver.name}</Text>
            <Text style={styles.carDetail}>
              {driver.car?.model} • {driver.car?.plateNumber}
            </Text>
          </View>
          <View style={styles.ratingBadge}>
            <Icon name="star" size={12} color={COLORS.primary} />
            <Text style={styles.ratingText}>{driver.rating}</Text>
          </View>
        </View>

        {/* Actions */}
        <CustomButton
          title={t('rider.rateDriver')}
          onPress={handleRate}
          variant="primary"
          icon="star"
          iconPosition="right"
          style={styles.rateBtn}
        />

        <CustomButton
          title={t('common.home')}
          variant="outline"
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.popToTop();
            } else {
              navigation.navigate('RiderTabs', { screen: 'RiderHome' });
            }
          }}
          style={styles.homeBtn}
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
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 76,
    height: 76,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  successTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: '800',
    color: COLORS.text,
  },
  successSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: SPACING.xl,
  },
  fareHighlightCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  farePaidLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
  },
  fareAmount: {
    ...TYPOGRAPHY.h1,
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.text,
    marginVertical: SPACING.xs,
  },
  paidMethodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
  },
  paidMethodText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: SPACING.xs,
  },
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
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
  card: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  destSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: COLORS.secondPrimary,
    marginRight: SPACING.md,
  },
  destinationText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  driverCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.secondPrimaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarInitials: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.secondPrimaryDark,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  carDetail: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.small,
  },
  ratingText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginLeft: 2,
  },
  rateBtn: {
    width: '100%',
  },
  homeBtn: {
    width: '100%',
    marginTop: SPACING.sm,
  },
});

export default TripCompletedScreen;
