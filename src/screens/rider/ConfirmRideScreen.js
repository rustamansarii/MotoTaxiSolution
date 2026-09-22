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
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import Icon from '../../components/Icon';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import { useResponsive } from '../../utils/responsive';
import { formatCurrency } from '../../utils/formatters';
import { MOCK_RIDES } from '../../data/mockRides';
import { MOCK_PAYMENT_METHODS } from '../../data/mockTransactions';

export const ConfirmRideScreen = ({ navigation, route }) => {
  const { isSplitLayout, insets } = useResponsive();
  const selectedRide = route.params?.selectedRide || MOCK_RIDES[0];
  const pickup = route.params?.pickup || '5th Ave & 58th St';
  const destination = route.params?.destination || 'JFK International Airport';

  const [paymentMethod, setPaymentMethod] = useState(
    route.params?.paymentMethod || MOCK_PAYMENT_METHODS[0]
  );
  const [promoCode, setPromoCode] = useState('RIDEGO20');
  const [promoApplied, setPromoApplied] = useState(true);

  const baseFare = selectedRide.price;
  const discount = promoApplied ? 4.5 : 0;
  const bookingFee = 2.0;
  const totalFare = Math.max(0, baseFare + bookingFee - discount);

  const handleConfirm = () => {
    navigation.navigate('SearchingDriver', {
      selectedRide,
      pickup,
      destination,
      totalFare,
    });
  };

  const routeCard = (
    <View style={styles.card}>
      <Text style={styles.cardHeader}>Trip Route</Text>
      <View style={styles.routeRow}>
        <View style={styles.dotPickup} />
        <View style={styles.routeDetails}>
          <Text style={styles.routeLabel}>Pickup</Text>
          <Text numberOfLines={1} style={styles.routeAddress}>
            {pickup}
          </Text>
        </View>
      </View>

      <View style={styles.routeConnector} />

      <View style={styles.routeRow}>
        <View style={styles.squareDest} />
        <View style={styles.routeDetails}>
          <Text style={styles.routeLabel}>Destination</Text>
          <Text numberOfLines={1} style={styles.routeAddress}>
            {destination}
          </Text>
        </View>
      </View>
    </View>
  );

  const vehicleCard = (
    <View style={styles.vehicleOverviewCard}>
      <View style={styles.vehicleIconCircle}>
        <Icon name="car" size={26} color={COLORS.secondPrimary} />
      </View>
      <View style={styles.vehicleDetailsCol}>
        <Text style={styles.vehicleName}>{selectedRide.name}</Text>
        <Text style={styles.vehicleDesc}>{selectedRide.description}</Text>
      </View>
      <View style={styles.vehicleEtaBadge}>
        <Text style={styles.vehicleEtaText}>{selectedRide.eta}</Text>
      </View>
    </View>
  );

  const promoSection = (
    <View style={styles.promoSection}>
      <View style={styles.promoInputCol}>
        <CustomInput
          label="Promo Code"
          value={promoCode}
          onChangeText={setPromoCode}
          placeholder="Enter discount code"
          leftIcon="tag"
          containerStyle={styles.noMargin}
        />
      </View>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setPromoApplied(!promoApplied)}
        style={[
          styles.applyBtn,
          promoApplied && styles.appliedBtn,
        ]}
      >
        {promoApplied ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.appliedBtnText}>Applied </Text>
            <Icon name="check" size={12} color={COLORS.primary} />
          </View>
        ) : (
          <Text style={styles.applyBtnText}>Apply</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const fareCard = (
    <View style={styles.card}>
      <Text style={styles.cardHeader}>Fare Breakdown</Text>

      <View style={styles.fareRow}>
        <Text style={styles.fareLabel}>Trip Fare ({selectedRide.name})</Text>
        <Text style={styles.fareValue}>{formatCurrency(baseFare)}</Text>
      </View>

      <View style={styles.fareRow}>
        <Text style={styles.fareLabel}>Booking & Platform Fee</Text>
        <Text style={styles.fareValue}>{formatCurrency(bookingFee)}</Text>
      </View>

      {promoApplied && (
        <View style={styles.fareRow}>
          <Text style={[styles.fareLabel, styles.discountText]}>
            Promo Code Discount
          </Text>
          <Text style={[styles.fareValue, styles.discountText]}>
            -{formatCurrency(discount)}
          </Text>
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Estimated Total</Text>
        <Text style={styles.totalValue}>{formatCurrency(totalFare)}</Text>
      </View>
    </View>
  );

  const paymentCard = (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => navigation.navigate('Wallet')}
      style={styles.paymentCard}
    >
      <View style={styles.paymentIconBox}>
        <Icon name="apple" size={20} color={COLORS.text} />
      </View>
      <View style={styles.paymentInfo}>
        <Text style={styles.paymentTitle}>{paymentMethod.name}</Text>
        <Text style={styles.paymentSubtitle}>Tap to change payment method</Text>
      </View>
      <Icon name="chevron-right" size={18} color={COLORS.iconLight} />
    </TouchableOpacity>
  );

  const confirmButton = (
    <CustomButton
      title={`Confirm & Request ${selectedRide.name}`}
      onPress={handleConfirm}
      variant="primary"
      icon="arrow-right"
      iconPosition="right"
      style={styles.confirmButton}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ResponsiveContainer maxWidth={960} style={{ flex: 1 }}>
        <Header
          title="Confirm Ride"
          onBack={() => navigation.goBack()}
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + SPACING.lg, SPACING.xxxl) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {isSplitLayout ? (
            <View style={styles.splitColumnsRow}>
              <View style={styles.splitColumn}>
                {routeCard}
                {vehicleCard}
              </View>
              <View style={styles.splitColumn}>
                {promoSection}
                {fareCard}
                {paymentCard}
                {confirmButton}
              </View>
            </View>
          ) : (
            <>
              {routeCard}
              {vehicleCard}
              {promoSection}
              {fareCard}
              {paymentCard}
              {confirmButton}
            </>
          )}
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
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  splitColumnsRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    alignItems: 'flex-start',
  },
  splitColumn: {
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.large,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotPickup: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.md,
  },
  squareDest: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: COLORS.secondPrimary,
    marginRight: SPACING.md,
  },
  routeConnector: {
    width: 2,
    height: 18,
    backgroundColor: COLORS.border,
    marginLeft: 4,
    marginVertical: 2,
  },
  routeDetails: {
    flex: 1,
  },
  routeLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  routeAddress: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  vehicleOverviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  vehicleIconCircle: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  vehicleDetailsCol: {
    flex: 1,
  },
  vehicleName: {
    ...TYPOGRAPHY.title,
    fontWeight: '700',
    color: COLORS.text,
  },
  vehicleDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  vehicleEtaBadge: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.small,
  },
  vehicleEtaText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.secondPrimary,
  },
  promoSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  promoInputCol: {
    flex: 1,
  },
  noMargin: {
    marginBottom: 0,
  },
  applyBtn: {
    height: 54,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.secondPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appliedBtn: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  applyBtnText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.white,
  },
  appliedBtnText: {
    color: COLORS.primaryDark,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  fareLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textLight,
  },
  fareValue: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.text,
  },
  discountText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  totalLabel: {
    ...TYPOGRAPHY.title,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalValue: {
    ...TYPOGRAPHY.h2,
    fontWeight: '800',
    color: COLORS.text,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  paymentIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  paymentSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  confirmButton: {
    marginTop: SPACING.xs,
  },
});

export default ConfirmRideScreen;
