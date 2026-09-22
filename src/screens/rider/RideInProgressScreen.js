import React from 'react';
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
import Icon from '../../components/Icon';
import AdaptiveSplitView from '../../components/AdaptiveSplitView';
import { useResponsive } from '../../utils/responsive';
import { ScrollView } from 'react-native';
import { ACTIVE_MOCK_DRIVER } from '../../data/mockDrivers';

export const RideInProgressScreen = ({ navigation, route }) => {
  const { isSplitLayout, isFoldableOrTablet, insets, width } = useResponsive();
  const driver = route.params?.driver || ACTIVE_MOCK_DRIVER;
  const totalFare = route.params?.totalFare || 18.5;

  const handleCompleteTrip = () => {
    navigation.replace('TripCompleted', {
      driver,
      totalFare,
      tripDistance: '5.8 mi',
      tripDuration: '18 mins',
      destination: 'JFK International Airport',
    });
  };

  const mapPane = (
    <View style={styles.mapArea}>
      <MapPlaceholder
        showRoute={true}
        showPickupMarker={false}
        showDestinationMarker={true}
        showDriverMarker={true}
        destinationLabel="JFK Terminal 4"
        height="100%"
      />
    </View>
  );

  const statusContent = (
    <View
      style={[
        styles.bottomCard,
        isSplitLayout && styles.sideCard,
        !isSplitLayout && {
          paddingBottom: Math.max(insets.bottom + SPACING.md, SPACING.xl),
        },
      ]}
    >
      {/* ETA & Distance */}
      <View style={styles.etaRow}>
        <View style={styles.etaCol}>
          <Text style={styles.etaLabel}>Estimated Arrival</Text>
          <Text style={styles.etaTime}>11:42 AM</Text>
        </View>
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>12 min • 4.8 mi</Text>
        </View>
      </View>

      {/* Destination Card */}
      <View style={styles.destRow}>
        <View style={styles.destDot} />
        <View style={styles.destInfo}>
          <Text style={styles.destLabel}>Destination</Text>
          <Text numberOfLines={1} style={styles.destTitle}>
            JFK International Airport, Terminal 4
          </Text>
        </View>
      </View>

      {/* Driver mini card */}
      <View style={styles.driverMiniRow}>
        <View style={styles.driverAvatar}>
          <Text style={styles.avatarInitials}>
            {driver.name.charAt(0)}
          </Text>
        </View>
        <View style={styles.driverMiniInfo}>
          <Text style={styles.driverName}>{driver.name}</Text>
          <Text style={styles.carName}>
            {driver.car?.model} • {driver.car?.plateNumber}
          </Text>
        </View>
        <TouchableOpacity style={styles.sosBtn}>
          <Icon name="shield" size={16} color={COLORS.danger} />
          <Text style={styles.sosText}>SOS</Text>
        </TouchableOpacity>
      </View>

      {/* Finish / Next Step Simulation CTA */}
      <CustomButton
        title="Arrive at Destination • Complete Trip"
        onPress={handleCompleteTrip}
        variant="primary"
        icon="check"
        iconPosition="right"
        style={styles.arriveBtn}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Navigation Top Status Pill */}
      <View
        style={[
          styles.navTopBar,
          {
            top: Math.max(insets.top + 10, 30),
            maxWidth: isFoldableOrTablet ? 520 : width - 32,
            alignSelf: 'center',
          },
        ]}
      >
        <View style={styles.turnIconBox}>
          <Icon name="navigation" size={20} color={COLORS.white} />
        </View>
        <View style={styles.turnInfo}>
          <Text style={styles.turnDistance}>In 500 ft</Text>
          <Text numberOfLines={1} style={styles.turnStreet}>
            Continue onto FDR Dr North
          </Text>
        </View>
        <View style={styles.speedPill}>
          <Text style={styles.speedVal}>42</Text>
          <Text style={styles.speedUnit}>MPH</Text>
        </View>
      </View>

      <AdaptiveSplitView
        primaryPane={mapPane}
        secondaryPane={
          isSplitLayout ? (
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
            >
              {statusContent}
            </ScrollView>
          ) : (
            statusContent
          )
        }
        primaryRatio={0.6}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  navTopBar: {
    position: 'absolute',
    top: 50,
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 10,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  turnIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.secondPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  turnInfo: {
    flex: 1,
  },
  turnDistance: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  turnStreet: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  speedPill: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.small,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  speedVal: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: COLORS.text,
  },
  speedUnit: {
    ...TYPOGRAPHY.caption,
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  mapArea: {
    flex: 1,
  },
  bottomCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.extraLarge,
    borderTopRightRadius: RADIUS.extraLarge,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  sideCard: {
    height: '100%',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderLeftWidth: 1,
    borderTopWidth: 0,
    justifyContent: 'center',
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  etaCol: {},
  etaLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  etaTime: {
    ...TYPOGRAPHY.h2,
    fontWeight: '800',
    color: COLORS.text,
  },
  distanceBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
  },
  distanceText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  destRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.md,
  },
  destDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: COLORS.secondPrimary,
    marginRight: SPACING.md,
  },
  destInfo: {
    flex: 1,
  },
  destLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  destTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  driverMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  driverAvatar: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.secondPrimaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  avatarInitials: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.secondPrimaryDark,
  },
  driverMiniInfo: {
    flex: 1,
  },
  driverName: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  carName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  sosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  sosText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.danger,
    marginLeft: 4,
  },
  arriveBtn: {
    width: '100%',
  },
});

export default RideInProgressScreen;
