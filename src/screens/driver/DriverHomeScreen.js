import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import MapPlaceholder from '../../components/MapPlaceholder';
import CustomButton from '../../components/CustomButton';
import ProfileAvatar from '../../components/ProfileAvatar';
import Icon from '../../components/Icon';
import AdaptiveSplitView from '../../components/AdaptiveSplitView';
import { useResponsive } from '../../utils/responsive';
import { ScrollView } from 'react-native';
import { formatCurrency } from '../../utils/formatters';
import { MOCK_DRIVER_STATS } from '../../data/mockDrivers';

export const DriverHomeScreen = ({ navigation }) => {
  const { isSplitLayout, isFoldableOrTablet, insets, width } = useResponsive();
  const [isOnline, setIsOnline] = useState(true);

  const toggleOnline = () => {
    setIsOnline(!isOnline);
  };

  const handleSimulateRequest = () => {
    navigation.navigate('RideRequest', {
      pickup: 'Corner of 5th Ave & 59th St',
      destination: 'JFK Terminal 4',
      passengerName: 'Elena Rostova',
      passengerRating: '4.95',
      estimatedFare: 28.5,
      distanceToPickup: '0.6 mi',
      timeToPickup: '3 mins',
      tripDistance: '16.4 mi',
    });
  };

  const mapPane = (
    <View style={styles.mapArea}>
      <MapPlaceholder
        showRoute={false}
        showPickupMarker={false}
        showDestinationMarker={false}
        showDriverMarker={true}
        isDriverMode={true}
        driverEta="Active"
        height="100%"
      />

      {/* Incoming Trip Request Simulation Button */}
      {isOnline && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSimulateRequest}
          style={styles.incomingRequestFloatingBadge}
        >
          <View style={styles.floatingPulse} />
          <Icon name="flash" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
          <Text style={styles.incomingBadgeText}>
            Incoming Request Available (Tap to test)
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const summaryPanel = (
    <View
      style={[
        styles.bottomPanel,
        isOnline ? styles.onlinePanel : styles.offlinePanel,
        isSplitLayout && styles.sidePanel,
        !isSplitLayout && {
          paddingBottom: Math.max(insets.bottom + SPACING.lg, SPACING.xl),
        },
      ]}
    >
      {!isSplitLayout && <View style={styles.dragHandle} />}

      {/* Earnings Ticker */}
      <View style={styles.earningsRow}>
        <View>
          <Text
            style={[
              styles.earningsLabel,
              { color: isOnline ? COLORS.primary : COLORS.textLight },
            ]}
          >
            Today's Earnings
          </Text>
          <Text
            style={[
              styles.earningsAmount,
              { color: isOnline ? COLORS.white : COLORS.text },
            ]}
          >
            {formatCurrency(MOCK_DRIVER_STATS.dailyEarnings)}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('DriverEarnings')}
          style={styles.viewEarningsBtn}
        >
          <Text style={styles.viewEarningsText}>Weekly Stats ›</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCell}>
          <Text
            style={[
              styles.statNumber,
              { color: isOnline ? COLORS.white : COLORS.text },
            ]}
          >
            4.2 hrs
          </Text>
          <Text style={styles.statCaption}>Online Time</Text>
        </View>

        <View style={styles.statCellDivider} />

        <View style={styles.statCell}>
          <Text
            style={[
              styles.statNumber,
              { color: isOnline ? COLORS.white : COLORS.text },
            ]}
          >
            8
          </Text>
          <Text style={styles.statCaption}>Trips Completed</Text>
        </View>

        <View style={styles.statCellDivider} />

        <View style={styles.statCell}>
          <Text
            style={[
              styles.statNumber,
              { color: isOnline ? COLORS.primary : COLORS.secondPrimary },
            ]}
          >
            {MOCK_DRIVER_STATS.acceptanceRate}
          </Text>
          <Text style={styles.statCaption}>Acceptance</Text>
        </View>
      </View>

      {/* Direct Action Trigger */}
      {isOnline ? (
        <CustomButton
          title="Simulate Incoming Trip"
          onPress={handleSimulateRequest}
          variant="primary"
          icon="navigation"
          iconPosition="right"
          style={styles.requestCta}
        />
      ) : (
        <CustomButton
          title="Go Online to Receive Trips"
          onPress={toggleOnline}
          variant="secondary"
          style={styles.requestCta}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={isOnline ? 'light-content' : 'dark-content'}
        backgroundColor={isOnline ? COLORS.backgroundglass : COLORS.white}
      />

      {/* Top Floating Dashboard Header */}
      <View
        style={[
          styles.topBar,
          {
            top: Math.max(insets.top + 10, 30),
            maxWidth: isFoldableOrTablet ? 560 : width - 32,
            alignSelf: 'center',
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('DriverProfile')}
          activeOpacity={0.8}
          style={styles.driverProfileBtn}
        >
          <ProfileAvatar
            name="Marcus Vance"
            size={42}
            isOnline={isOnline}
            showStatus={true}
          />
          <View style={styles.driverNameCol}>
            <Text style={styles.driverName}>Marcus Vance</Text>
            <View style={styles.driverRatingRow}>
              <Icon name="star" size={12} color={COLORS.primary} />
              <Text style={styles.driverRatingText}>
                {MOCK_DRIVER_STATS.rating}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Online / Offline Toggle Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={toggleOnline}
          style={[
            styles.statusPill,
            isOnline ? styles.onlinePill : styles.offlinePill,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? COLORS.primary : COLORS.iconLight },
            ]}
          />
          <Text
            style={[
              styles.statusPillText,
              { color: isOnline ? COLORS.white : COLORS.text },
            ]}
          >
            {isOnline ? 'YOU ARE ONLINE' : 'GO ONLINE'}
          </Text>
        </TouchableOpacity>
      </View>

      <AdaptiveSplitView
        primaryPane={mapPane}
        secondaryPane={
          isSplitLayout ? (
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
            >
              {summaryPanel}
            </ScrollView>
          ) : (
            summaryPanel
          )
        }
        primaryRatio={0.55}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 10,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.extraLarge,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  driverProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverNameCol: {
    marginLeft: SPACING.sm,
  },
  driverName: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  driverRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  driverRatingText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
  },
  onlinePill: {
    backgroundColor: COLORS.backgroundglass,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  offlinePill: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.round,
    marginRight: 6,
  },
  statusPillText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mapArea: {
    flex: 1,
    position: 'relative',
  },
  incomingRequestFloatingBadge: {
    position: 'absolute',
    top: 75,
    alignSelf: 'center',
    backgroundColor: COLORS.backgroundglass,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.round,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingPulse: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.sm,
  },
  incomingBadgeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.white,
  },
  bottomPanel: {
    borderTopLeftRadius: RADIUS.extraLarge,
    borderTopRightRadius: RADIUS.extraLarge,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  onlinePanel: {
    backgroundColor: COLORS.backgroundglass,
    borderTopWidth: 1,
    borderColor: COLORS.secondBackgroundglass,
  },
  offlinePanel: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  sidePanel: {
    height: '100%',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderLeftWidth: 1,
    borderTopWidth: 0,
    justifyContent: 'center',
  },
  dragHandle: {
    width: 42,
    height: 4,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  earningsLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  earningsAmount: {
    ...TYPOGRAPHY.h1,
    fontSize: 32,
    fontWeight: '800',
    marginTop: 2,
  },
  viewEarningsBtn: {
    padding: SPACING.xs,
  },
  viewEarningsText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.secondBackgroundglass,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
  },
  statCaption: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
    fontSize: 10,
  },
  statCellDivider: {
    width: 1,
    height: '70%',
    backgroundColor: COLORS.backgroundglass,
  },
  requestCta: {
    width: '100%',
  },
});

export default DriverHomeScreen;
