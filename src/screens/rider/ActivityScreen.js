import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import StatusBadge from '../../components/StatusBadge';
import RatingStars from '../../components/RatingStars';
import EmptyState from '../../components/EmptyState';
import Icon from '../../components/Icon';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '../../utils/responsive';
import { formatCurrency } from '../../utils/formatters';
import { MOCK_RIDE_HISTORY } from '../../data/mockRides';

export const ActivityScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { isFoldableOrTablet, insets } = useResponsive();
  const [activeTab, setActiveTab] = useState('past'); // 'past' | 'upcoming'

  const handleRebook = (item) => {
    navigation.navigate('RideOptions', {
      pickup: item.pickup,
      destination: item.destination,
    });
  };

  const renderRideItem = ({ item }) => (
    <View style={[styles.historyCard, isFoldableOrTablet && { flex: 1 }]}>
      {/* Header */}
      <View style={styles.cardTopRow}>
        <View>
          <Text style={styles.rideDate}>{item.date}</Text>
          <Text style={styles.rideType}>{item.rideType}</Text>
        </View>
        <View style={styles.topRightCol}>
          <Text style={styles.ridePrice}>{formatCurrency(item.price)}</Text>
          <StatusBadge
            status={item.status === 'Completed' ? 'completed' : 'cancelled'}
            size="small"
          />
        </View>
      </View>

      {/* Locations */}
      <View style={styles.locationsBlock}>
        <View style={styles.locationRow}>
          <View style={styles.dotPickup} />
          <Text numberOfLines={1} style={styles.locationText}>
            {item.pickup}
          </Text>
        </View>
        <View style={styles.connector} />
        <View style={styles.locationRow}>
          <View style={styles.squareDest} />
          <Text numberOfLines={1} style={styles.locationText}>
            {item.destination}
          </Text>
        </View>
      </View>

      {/* Footer with driver, rating, and rebook button */}
      <View style={styles.cardFooter}>
        <View style={styles.driverCol}>
          <Text style={styles.driverLabel}>Driver: {item.driver}</Text>
          {item.rating ? (
            <RatingStars rating={item.rating} size={14} />
          ) : null}
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleRebook(item)}
          style={styles.rebookBtn}
        >
          <Icon name="refresh" size={14} color={COLORS.secondPrimary} />
          <Text style={styles.rebookText}>Rebook</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ResponsiveContainer maxWidth={880} style={{ flex: 1 }}>
        <Header
          title={t('rider.activity')}
          showBack={false}
        />

        {/* Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            onPress={() => setActiveTab('past')}
            style={[styles.tabItem, activeTab === 'past' && styles.activeTabItem]}
          >
            <Text
              style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}
            >
              {t('rider.allTrips')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('upcoming')}
            style={[
              styles.tabItem,
              activeTab === 'upcoming' && styles.activeTabItem,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'upcoming' && styles.activeTabText,
              ]}
            >
              {t('driver.trips')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'past' ? (
          <FlatList
            key={isFoldableOrTablet ? 'grid-2' : 'list-1'}
            data={MOCK_RIDE_HISTORY}
            keyExtractor={(item) => item.id}
            renderItem={renderRideItem}
            numColumns={isFoldableOrTablet ? 2 : 1}
            columnWrapperStyle={isFoldableOrTablet ? { gap: SPACING.md } : undefined}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: Math.max(insets.bottom + SPACING.lg, SPACING.xxxl) },
            ]}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <EmptyState
            icon="clock"
            title="No Scheduled Rides"
            description="You don't have any upcoming scheduled rides right now. Book a ride on demand anytime."
            buttonTitle="Book a Ride Now"
            onButtonPress={() => navigation.navigate('RiderHome')}
            style={styles.emptyContainer}
          />
        )}
      </ResponsiveContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  activeTabText: {
    color: COLORS.text,
    fontWeight: '700',
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  historyCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.large,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.md,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  rideDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  rideType: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  topRightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  ridePrice: {
    ...TYPOGRAPHY.title,
    fontWeight: '700',
    color: COLORS.text,
  },
  locationsBlock: {
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    marginVertical: SPACING.xs,
  },
  locationRow: {
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
  connector: {
    width: 2,
    height: 12,
    backgroundColor: COLORS.border,
    marginLeft: 3,
    marginVertical: 2,
  },
  locationText: {
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
  driverCol: {
    flex: 1,
  },
  driverLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  rebookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
  },
  rebookText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.secondPrimary,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
  },
});

export default ActivityScreen;
