import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import StatusBadge from '../../components/StatusBadge';
import Icon from '../../components/Icon';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '../../utils/responsive';
import { formatCurrency } from '../../utils/formatters';

const DRIVER_PAST_TRIPS = [
  {
    id: 'dtrip_1',
    date: 'Today, 2:15 PM',
    passenger: 'Elena Rostova',
    pickup: '5th Ave & 59th St',
    destination: 'JFK International Airport Terminal 4',
    fare: 37.0,
    surge: 3.5,
    tip: 5.0,
    distance: '16.4 mi',
    duration: '32 mins',
    status: 'completed',
  },
  {
    id: 'dtrip_2',
    date: 'Today, 11:30 AM',
    passenger: 'Julian Ross',
    pickup: 'Wall St & Broadway',
    destination: 'Chelsea Market, 9th Ave',
    fare: 22.4,
    surge: 0.0,
    tip: 3.0,
    distance: '3.8 mi',
    duration: '14 mins',
    status: 'completed',
  },
  {
    id: 'dtrip_3',
    date: 'Yesterday, 8:45 PM',
    passenger: 'Sophia Martinez',
    pickup: 'Times Square, 7th Ave',
    destination: 'Williamsburg, Bedford Ave',
    fare: 29.8,
    surge: 4.0,
    tip: 6.0,
    distance: '6.2 mi',
    duration: '24 mins',
    status: 'completed',
  },
  {
    id: 'dtrip_4',
    date: 'Yesterday, 6:10 PM',
    passenger: 'Lucas Vance',
    pickup: 'Columbus Circle, Central Park W',
    destination: 'LaGuardia Airport Terminal B',
    fare: 41.5,
    surge: 6.5,
    tip: 7.0,
    distance: '10.5 mi',
    duration: '28 mins',
    status: 'completed',
  },
];

export const DriverTripsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { isFoldableOrTablet, insets } = useResponsive();
  const [filter, setFilter] = useState('all'); // 'all' | 'today'

  const filteredTrips =
    filter === 'today'
      ? DRIVER_PAST_TRIPS.filter((t) => t.date.includes('Today'))
      : DRIVER_PAST_TRIPS;

  const renderTripItem = ({ item }) => (
    <View style={[styles.tripCard, isFoldableOrTablet && { flex: 1 }]}>
      {/* Top row with passenger & fare */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.dateText}>{item.date}</Text>
          <Text style={styles.passengerText}>{item.passenger}</Text>
        </View>

        <View style={styles.fareCol}>
          <Text style={styles.fareText}>{formatCurrency(item.fare)}</Text>
          {item.tip > 0 && (
            <Text style={styles.tipText}>+{formatCurrency(item.tip)} tip</Text>
          )}
        </View>
      </View>

      {/* Locations */}
      <View style={styles.routeBox}>
        <View style={styles.routeRow}>
          <View style={styles.dotPickup} />
          <Text numberOfLines={1} style={styles.addressText}>
            {item.pickup}
          </Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeRow}>
          <View style={styles.squareDest} />
          <Text numberOfLines={1} style={styles.addressText}>
            {item.destination}
          </Text>
        </View>
      </View>

      {/* Footer Details */}
      <View style={styles.cardFooter}>
        <Text style={styles.metaText}>
          {item.distance} • {item.duration}
        </Text>
        <StatusBadge status={item.status} size="small" />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ResponsiveContainer maxWidth={880} style={{ flex: 1 }}>
        <Header
          title={t('driver.tripHistory')}
          showBack={false}
          variant="light"
        />

        {/* Filter Tabs */}
        <View style={styles.filterBar}>
          <TouchableOpacity
            onPress={() => setFilter('all')}
            style={[styles.filterBtn, filter === 'all' && styles.activeFilterBtn]}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'all' && styles.activeFilterText,
              ]}
            >
              {t('rider.allTrips')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilter('today')}
            style={[
              styles.filterBtn,
              filter === 'today' && styles.activeFilterBtn,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'today' && styles.activeFilterText,
              ]}
            >
              {t('driver.todayEarnings')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Trips List */}
        <FlatList
          key={isFoldableOrTablet ? 'grid-2' : 'list-1'}
          data={filteredTrips}
          keyExtractor={(item) => item.id}
          renderItem={renderTripItem}
          numColumns={isFoldableOrTablet ? 2 : 1}
          columnWrapperStyle={isFoldableOrTablet ? { gap: SPACING.md } : undefined}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom + SPACING.lg, SPACING.xxxl) },
          ]}
          showsVerticalScrollIndicator={false}
        />
      </ResponsiveContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  filterBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.inputBg,
  },
  activeFilterBtn: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  filterText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  activeFilterText: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  tripCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.large,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.md,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  dateText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  passengerText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  fareCol: {
    alignItems: 'flex-end',
  },
  fareText: {
    ...TYPOGRAPHY.title,
    fontWeight: '800',
    color: COLORS.text,
  },
  tipText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 2,
  },
  routeBox: {
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    marginVertical: SPACING.xs,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotPickup: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.sm,
  },
  squareDest: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: COLORS.secondPrimary,
    marginRight: SPACING.sm,
  },
  routeLine: {
    width: 2,
    height: 12,
    backgroundColor: COLORS.border,
    marginLeft: 3,
    marginVertical: 2,
  },
  addressText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  metaText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.textLight,
  },
});

export default DriverTripsScreen;
