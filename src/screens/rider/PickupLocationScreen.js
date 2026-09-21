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
import Header from '../../components/Header';
import MapPlaceholder from '../../components/MapPlaceholder';
import CustomButton from '../../components/CustomButton';
import Icon from '../../components/Icon';
import AdaptiveSplitView from '../../components/AdaptiveSplitView';
import { useResponsive } from '../../utils/responsive';
import { CURRENT_LOCATION } from '../../data/mockLocations';

export const PickupLocationScreen = ({ navigation, route }) => {
  const { isSplitLayout, insets } = useResponsive();
  const [pickupAddress, setPickupAddress] = useState(
    route.params?.pickup || CURRENT_LOCATION.address
  );

  const handleConfirm = () => {
    navigation.navigate('RideOptions', {
      pickup: pickupAddress,
      destination: route.params?.destination || 'JFK International Airport',
    });
  };

  const mapPane = (
    <View style={styles.mapWrapper}>
      <MapPlaceholder
        showRoute={false}
        showPickupMarker={true}
        showDestinationMarker={false}
        showDriverMarker={false}
        pickupLabel={pickupAddress}
        height="100%"
      />

      {/* Floating Center Pin Helper */}
      <View style={styles.centerPinNotice}>
        <Text style={styles.centerPinText}>
          Drag map to adjust pickup pin
        </Text>
      </View>
    </View>
  );

  const detailPane = (
    <View
      style={[
        styles.bottomCard,
        isSplitLayout && styles.sideCard,
        !isSplitLayout && { paddingBottom: Math.max(insets.bottom + SPACING.md, SPACING.lg) },
      ]}
    >
      <View style={styles.pickupHeader}>
        <View style={styles.pinCircle}>
          <Icon name="map-pin" size={18} color={COLORS.white} />
        </View>
        <View style={styles.pickupInfo}>
          <Text style={styles.pickupHeading}>Pickup Location</Text>
          <Text numberOfLines={2} style={styles.addressText}>
            {pickupAddress}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            setPickupAddress('Corner of 5th Ave & 59th St (Front Entrance)')
          }
          style={styles.refineBtn}
        >
          <Text style={styles.refineText}>Refine</Text>
        </TouchableOpacity>
      </View>

      <CustomButton
        title="Confirm Pickup Spot"
        onPress={handleConfirm}
        icon="check"
        iconPosition="right"
        style={styles.confirmBtn}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Header
        title="Set Pickup Location"
        onBack={() => navigation.goBack()}
      />
      <AdaptiveSplitView
        primaryPane={mapPane}
        secondaryPane={detailPane}
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
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  centerPinNotice: {
    position: 'absolute',
    top: SPACING.md,
    alignSelf: 'center',
    backgroundColor: COLORS.backgroundglass,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  centerPinText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.white,
  },
  bottomCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderTopLeftRadius: RADIUS.extraLarge,
    borderTopRightRadius: RADIUS.extraLarge,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
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
  pickupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  pinCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  pickupInfo: {
    flex: 1,
  },
  pickupHeading: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
  },
  addressText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  refineBtn: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.small,
  },
  refineText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.secondPrimary,
  },
  confirmBtn: {
    width: '100%',
  },
});

export default PickupLocationScreen;
