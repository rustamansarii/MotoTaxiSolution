import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import MapPlaceholder from '../../components/MapPlaceholder';
import DriverCard from '../../components/DriverCard';
import CustomButton from '../../components/CustomButton';
import CustomModal from '../../components/CustomModal';
import Icon from '../../components/Icon';
import AdaptiveSplitView from '../../components/AdaptiveSplitView';
import { useResponsive } from '../../utils/responsive';
import { ACTIVE_MOCK_DRIVER } from '../../data/mockDrivers';

export const DriverAssignedScreen = ({ navigation, route }) => {
  const { isSplitLayout, insets } = useResponsive();
  const driver = route.params?.driver || ACTIVE_MOCK_DRIVER;
  const totalFare = route.params?.totalFare || 18.5;

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const handleStartRide = () => {
    navigation.navigate('RideInProgress', {
      driver,
      totalFare,
    });
  };

  const mapPane = (
    <View style={isSplitLayout ? styles.mapAreaSplit : styles.mapArea}>
      <MapPlaceholder
        showRoute={true}
        showPickupMarker={true}
        showDestinationMarker={false}
        showDriverMarker={true}
        driverEta="3 min away"
        pickupLabel="Your Location"
        height="100%"
      />

      {/* ETA Floating Notification */}
      <View style={styles.etaFloatingBanner}>
        <View style={styles.pulseDot} />
        <Text style={styles.etaBannerText}>
          Driver is on the way • Arrives in 3 mins
        </Text>
      </View>
    </View>
  );

  const driverDetailsPane = (
    <ScrollView
      style={[styles.sheetContainer, isSplitLayout && styles.sideSheetContainer]}
      contentContainerStyle={[
        styles.sheetContent,
        {
          paddingBottom: Math.max(insets.bottom + SPACING.lg, SPACING.xl),
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <DriverCard
        driver={driver}
        onCall={() => {}}
        onChat={() => {}}
        showPin={true}
      />

      {/* Safety & Action Tools */}
      <View style={styles.safetyRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {}}
          style={styles.safetyBtn}
        >
          <Icon name="share" size={16} color={COLORS.secondPrimary} />
          <Text style={styles.safetyBtnText}>Share Status</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowEmergencyModal(true)}
          style={[styles.safetyBtn, styles.emergencyBtn]}
        >
          <Icon name="shield" size={16} color={COLORS.danger} />
          <Text style={[styles.safetyBtnText, styles.emergencyText]}>
            Emergency SOS
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action CTAs */}
      <CustomButton
        title="Boarded Vehicle • Start Trip"
        onPress={handleStartRide}
        variant="primary"
        icon="check-circle"
        iconPosition="right"
        style={styles.actionBtn}
      />

      <CustomButton
        title="Cancel Ride"
        variant="outline"
        onPress={() => setShowCancelModal(true)}
        style={styles.secondaryCancelBtn}
      />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Header
        title="Driver Assigned"
        showBack={false}
        rightIcon="phone"
        onRightPress={() => {}}
      />

      <AdaptiveSplitView
        primaryPane={mapPane}
        secondaryPane={driverDetailsPane}
        primaryRatio={0.55}
      />

      {/* Modals */}
      <CustomModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Ride?"
        message="Driver is already en route. A small cancellation fee of $2.50 may apply."
        confirmText="Confirm Cancel"
        cancelText="Keep Ride"
        isDanger={true}
        onConfirm={() => {
          setShowCancelModal(false);
          navigation.navigate('RiderHome');
        }}
        icon="alert-triangle"
      />

      <CustomModal
        visible={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        title="Emergency Assistance"
        message="Dial 911 or alert 24/7 RideGo safety response team with your live GPS location?"
        confirmText="Call 911"
        cancelText="Dismiss"
        isDanger={true}
        onConfirm={() => setShowEmergencyModal(false)}
        icon="shield"
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
    height: '42%',
    position: 'relative',
  },
  mapAreaSplit: {
    flex: 1,
    height: '100%',
    position: 'relative',
  },
  etaFloatingBanner: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.backgroundglass,
    borderRadius: RADIUS.round,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.sm,
  },
  etaBannerText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.white,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.extraLarge,
    borderTopRightRadius: RADIUS.extraLarge,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  sideSheetContainer: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderLeftWidth: 1,
    borderTopWidth: 0,
  },
  sheetContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  safetyRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginVertical: SPACING.md,
  },
  safetyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.inputBg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.medium,
  },
  safetyBtnText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.secondPrimary,
    marginLeft: SPACING.xs,
  },
  emergencyBtn: {
    backgroundColor: COLORS.primaryLight,
  },
  emergencyText: {
    color: COLORS.danger,
  },
  actionBtn: {
    marginTop: SPACING.xs,
  },
  secondaryCancelBtn: {
    marginTop: SPACING.sm,
  },
});

export default DriverAssignedScreen;
