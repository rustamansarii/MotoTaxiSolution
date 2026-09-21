import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import MapPlaceholder from '../../components/MapPlaceholder';
import RideCard from '../../components/RideCard';
import CustomButton from '../../components/CustomButton';
import Icon from '../../components/Icon';
import AdaptiveSplitView from '../../components/AdaptiveSplitView';
import { useResponsive } from '../../utils/responsive';
import { MOCK_RIDES } from '../../data/mockRides';
import { MOCK_PAYMENT_METHODS } from '../../data/mockTransactions';

export const RideOptionsScreen = ({ navigation, route }) => {
  const { isSplitLayout, insets } = useResponsive();
  const pickup = route.params?.pickup || '5th Ave & 58th St';
  const destination = route.params?.destination || 'JFK Terminal 4';

  const [selectedRide, setSelectedRide] = useState(MOCK_RIDES[0]);
  const defaultPayment = MOCK_PAYMENT_METHODS[0];

  const handleSelectRide = (ride) => {
    setSelectedRide(ride);
  };

  const handleProceed = () => {
    navigation.navigate('ConfirmRide', {
      selectedRide,
      pickup,
      destination,
      paymentMethod: defaultPayment,
    });
  };

  const mapPane = (
    <View style={isSplitLayout ? styles.mapAreaSplit : styles.mapArea}>
      <MapPlaceholder
        showRoute={true}
        showPickupMarker={true}
        showDestinationMarker={true}
        showDriverMarker={true}
        pickupLabel={pickup}
        destinationLabel={destination}
        height="100%"
      />
    </View>
  );

  const optionsPane = (
    <View
      style={[
        styles.bottomSection,
        isSplitLayout && styles.sideSection,
        !isSplitLayout && {
          paddingBottom: Math.max(insets.bottom + SPACING.sm, SPACING.lg),
        },
      ]}
    >
      {!isSplitLayout && <View style={styles.sheetHandle} />}

      <Text style={styles.sectionTitle}>Available Categories</Text>

      <ScrollView
        style={styles.ridesScroll}
        showsVerticalScrollIndicator={false}
      >
        {MOCK_RIDES.map((ride) => (
          <RideCard
            key={ride.id}
            ride={ride}
            isSelected={selectedRide.id === ride.id}
            onSelect={handleSelectRide}
          />
        ))}
      </ScrollView>

      {/* Quick Payment & Confirm CTA */}
      <View
        style={[
          styles.footerRow,
          isSplitLayout && {
            paddingBottom: Math.max(insets.bottom + SPACING.xs, SPACING.sm),
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Wallet')}
          style={styles.paymentSelector}
        >
          <Icon name="apple" size={18} color={COLORS.text} />
          <Text style={styles.paymentText}>{defaultPayment.name}</Text>
          <Icon name="chevron-right" size={14} color={COLORS.iconLight} />
        </TouchableOpacity>

        <CustomButton
          title={`Select ${selectedRide.name}`}
          onPress={handleProceed}
          variant="primary"
          style={styles.bookBtn}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Header
        title="Choose a Ride"
        onBack={() => navigation.goBack()}
      />
      <AdaptiveSplitView
        primaryPane={mapPane}
        secondaryPane={optionsPane}
        primaryRatio={0.52}
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
    height: '35%',
  },
  mapAreaSplit: {
    flex: 1,
    height: '100%',
  },
  bottomSection: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.extraLarge,
    borderTopRightRadius: RADIUS.extraLarge,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  sideSection: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderLeftWidth: 1,
    borderTopWidth: 0,
    paddingTop: SPACING.md,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  ridesScroll: {
    flex: 1,
  },
  footerRow: {
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  paymentSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.sm,
  },
  paymentText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    marginLeft: SPACING.sm,
  },
  bookBtn: {
    width: '100%',
  },
});

export default RideOptionsScreen;
