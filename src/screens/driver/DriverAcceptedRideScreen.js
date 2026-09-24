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
import { useTranslation } from 'react-i18next';
import { useResponsive } from '../../utils/responsive';
import { ScrollView } from 'react-native';

export const DriverAcceptedRideScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { isSplitLayout, isFoldableOrTablet, insets, width } = useResponsive();
  const pickup = route.params?.pickup || 'Corner of 5th Ave & 59th St';
  const destination = route.params?.destination || 'JFK Terminal 4';
  const passengerName = route.params?.passengerName || 'Elena Rostova';
  const passengerRating = route.params?.passengerRating || '4.95';
  const estimatedFare = route.params?.estimatedFare || 28.5;

  const handleArrived = () => {
    navigation.replace('DriverArrived', {
      pickup,
      destination,
      passengerName,
      estimatedFare,
    });
  };

  const mapPane = (
    <View style={styles.mapArea}>
      <MapPlaceholder
        showRoute={true}
        showPickupMarker={true}
        showDestinationMarker={false}
        showDriverMarker={true}
        pickupLabel={pickup}
        height="100%"
      />
    </View>
  );

  const passengerPane = (
    <View
      style={[
        styles.bottomCard,
        isSplitLayout && styles.sideCard,
        !isSplitLayout && {
          paddingBottom: Math.max(insets.bottom + SPACING.md, SPACING.xl),
        },
      ]}
    >
        <View style={styles.pickupAddressRow}>
          <View style={styles.pickupPinCircle}>
            <Icon name="map-pin" size={16} color={COLORS.primary} />
          </View>
          <View style={styles.pickupAddressCol}>
            <Text style={styles.pickupLabel}>{t('driver.pickUpPassenger')}</Text>
            <Text numberOfLines={1} style={styles.pickupAddress}>
              {pickup}
            </Text>
          </View>
        </View>

        {/* Passenger mini card */}
        <View style={styles.passengerCard}>
          <View style={styles.passengerAvatar}>
            <Text style={styles.avatarInitials}>
              {passengerName.charAt(0)}
            </Text>
          </View>

          <View style={styles.passengerDetails}>
            <Text style={styles.passengerName}>{passengerName}</Text>
            <View style={styles.ratingRow}>
              <Icon name="star" size={12} color={COLORS.primary} />
              <Text style={styles.ratingText}>{passengerRating}</Text>
              <Text style={styles.paymentTag}>• In-App Paid</Text>
            </View>
          </View>

          <View style={styles.contactActions}>
            <TouchableOpacity style={styles.contactBtn}>
              <Icon name="phone" size={18} color={COLORS.secondPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactBtn}>
              <Icon name="chat" size={18} color={COLORS.secondPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* CTA: Arrived at Pickup */}
        <CustomButton
          title={t('driver.driverArrivedBtn')}
          onPress={handleArrived}
          variant="primary"
          icon="check-circle"
          iconPosition="right"
          style={styles.arrivedBtn}
        />
      </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Top Turn Header */}
      <View
        style={[
          styles.topTurnHeader,
          {
            top: Math.max(insets.top + 10, 30),
            maxWidth: isFoldableOrTablet ? 540 : width - 32,
            alignSelf: 'center',
          },
        ]}
      >
        <View style={styles.turnIconBox}>
          <Icon name="arrow-right" size={20} color={COLORS.white} />
        </View>
        <View style={styles.turnInfo}>
          <Text style={styles.turnDist}>In 250 ft • {t('navigation.turnRight')}</Text>
          <Text numberOfLines={1} style={styles.turnStreet}>
            onto 5th Ave towards pickup
          </Text>
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
              {passengerPane}
            </ScrollView>
          ) : (
            passengerPane
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
  topTurnHeader: {
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
  turnDist: {
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
  etaBox: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.small,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  etaMin: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: COLORS.text,
  },
  etaUnit: {
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
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
  pickupAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    padding: SPACING.md,
    borderRadius: RADIUS.large,
    marginBottom: SPACING.md,
  },
  pickupPinCircle: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  pickupAddressCol: {
    flex: 1,
  },
  pickupLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  pickupAddress: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  passengerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  passengerAvatar: {
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
  passengerDetails: {
    flex: 1,
  },
  passengerName: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 3,
  },
  paymentTag: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  contactActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  contactBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrivedBtn: {
    width: '100%',
  },
});

export default DriverAcceptedRideScreen;
