import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import Icon from '../../components/Icon';
import AdaptiveSplitView from '../../components/AdaptiveSplitView';
import { useResponsive, responsiveFont } from '../../utils/responsive';
import { formatCurrency } from '../../utils/formatters';
import {
  PaymentMethodSelector,
  CardPaymentForm,
  QRCodePayment,
  MobileMoneyForm,
  CashPayment,
  PaymentButton,
  PaymentStatus,
} from '../../components/payment';
import {
  validateCard,
  validateMobileMoney,
  processCardPayment,
  generateQRCode,
  checkQRCodeStatus,
  processMobileMoneyPayment,
  confirmCashPayment,
} from '../../services/paymentService';
import { driverCompleteTrip } from '../../redux/features/driver/driverSlice';

export const PaymentMethodScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { isSplitLayout, insets, width } = useResponsive();

  // Extract trip parameters passed from DriverTripScreen or Rider stack
  const rideId =
    route.params?.ride_id ||
    route.params?.rideId ||
    route.params?.tripId ||
    52;

  const totalFare =
    route.params?.fare ??
    route.params?.totalFare ??
    route.params?.amount ??
    24.5;

  const currency = route.params?.currency || 'USD';
  const pickup = route.params?.pickup || 'Pickup Location';
  const destination = route.params?.destination || 'Destination';
  const passengerName =
    route.params?.passengerName ||
    route.params?.riderName ||
    'Passenger';
  const distance = route.params?.distance || '5.2 km';
  const duration = route.params?.duration || '14 mins';
  const vehicleType = route.params?.vehicleType || 'CAR';
  const isDriver = route.params?.isDriver ?? true; // Default true when opened by driver

  // Payment state: "card" | "qr" | "mobile_money" | "cash"
  const [paymentMethod, setPaymentMethod] = useState('card');

  // Payment Status: "idle" | "processing" | "success" | "failed" | "pending"
  const [paymentStatus, setPaymentStatus] = useState('idle');

  // Form states
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiry: '',
    cvv: '',
  });

  const [mobileData, setMobileData] = useState({
    phone: '',
    countryCode: '+254',
    provider: 'mpesa',
  });

  const [cashNote, setCashNote] = useState('');
  const [errors, setErrors] = useState({});
  const [transactionId, setTransactionId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [checkingQR, setCheckingQR] = useState(false);
  const [qrStatus, setQrStatus] = useState('pending');

  const formattedAmount = formatCurrency(
    totalFare,
    currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency
  );

  // Clear errors when switching method
  const handleSelectMethod = (methodId) => {
    if (paymentStatus === 'processing') return;
    setPaymentMethod(methodId);
    setErrors({});
    setErrorMessage('');
  };

  // 1. Submit Card Payment
  const handleSubmitCard = async () => {
    const valResult = validateCard(cardData);
    if (!valResult.isValid) {
      setErrors(valResult.errors);
      return;
    }

    setErrors({});
    setPaymentStatus('processing');

    try {
      const res = await processCardPayment({
        cardNumber: cardData.cardNumber,
        cardHolder: cardData.cardHolder,
        expiry: cardData.expiry,
        cvv: cardData.cvv,
        amount: totalFare,
        currency,
        rideId,
      });

      setTransactionId(res.transactionId);
      setPaymentStatus('success');

      // If driver initiated, dispatch complete trip to server
      if (isDriver) {
        dispatch(driverCompleteTrip({ rideId }));
      }
    } catch (err) {
      setErrorMessage(err?.message || 'Payment processing failed');
      setPaymentStatus('failed');
    }
  };

  // 2. Check QR Code Status
  const handleCheckQRStatus = async () => {
    setCheckingQR(true);
    try {
      const res = await checkQRCodeStatus({ qrId: `QR_${rideId}`, rideId });
      if (res.status === 'success') {
        setQrStatus('success');
        setTransactionId(res.transactionId);
        setPaymentStatus('success');
        if (isDriver) {
          dispatch(driverCompleteTrip({ rideId }));
        }
      } else {
        setQrStatus('pending');
        Alert.alert('Payment Pending', 'Awaiting customer scan & payment.');
      }
    } catch (err) {
      setQrStatus('failed');
      Alert.alert('Verification Error', 'Could not verify payment status.');
    } finally {
      setCheckingQR(false);
    }
  };

  // 3. Submit Mobile Money
  const handleSubmitMobileMoney = async () => {
    const valResult = validateMobileMoney(mobileData);
    if (!valResult.isValid) {
      setErrors(valResult.errors);
      return;
    }

    setErrors({});
    setPaymentStatus('processing');

    try {
      const res = await processMobileMoneyPayment({
        phone: mobileData.phone,
        countryCode: mobileData.countryCode,
        provider: mobileData.provider,
        amount: totalFare,
        currency,
        rideId,
      });

      setTransactionId(res.transactionId);
      setPaymentStatus('success');

      if (isDriver) {
        dispatch(driverCompleteTrip({ rideId }));
      }
    } catch (err) {
      setErrorMessage(err?.message || 'Mobile money request failed');
      setPaymentStatus('failed');
    }
  };

  // 4. Confirm Cash Payment
  const handleConfirmCash = async () => {
    setPaymentStatus('processing');
    try {
      const res = await confirmCashPayment({
        rideId,
        amount: totalFare,
        currency,
        note: cashNote,
        collected: true,
      });

      setTransactionId(res.transactionId);
      setPaymentStatus('success');

      if (isDriver) {
        dispatch(driverCompleteTrip({ rideId }));
      }
    } catch (err) {
      setErrorMessage(err?.message || 'Failed to confirm cash payment');
      setPaymentStatus('failed');
    }
  };

  // Primary action button handler based on selected payment method
  const handlePrimaryPaymentAction = () => {
    if (paymentStatus === 'processing') return;

    switch (paymentMethod) {
      case 'card':
        handleSubmitCard();
        break;
      case 'qr':
        handleCheckQRStatus();
        break;
      case 'mobile_money':
        handleSubmitMobileMoney();
        break;
      case 'cash':
        handleConfirmCash();
        break;
    }
  };

  // Navigation after successful payment
  const handleFinishPayment = () => {
    setPaymentStatus('idle');

    console.log("isDriver",isDriver)

    // if (isDriver) {
    //   navigation.replace('DriverTripCompleted', {
    //     ride_id: rideId,
    //     rideId,
    //     pickup,
    //     destination,
    //     passengerName,
    //     fare: totalFare,
    //     currency,
    //     distance,
    //     duration,
    //     vehicleType,
    //     paymentMethod,
    //     transactionId,
    //     isDriver: true,
    //   });
    // } else {
    //   // If opened from rider flow
    //   if (navigation.canGoBack()) {
    //     navigation.pop();
    //   } else {
    //     navigation.navigate('RiderTabs', { screen: 'RiderHome' });
    //   }
    // }
  };

  // Action Button title & icon
  const actionButtonProps = useMemo(() => {
    switch (paymentMethod) {
      case 'card':
        return {
          title: `Pay Now`,
          amount: formattedAmount,
          icon: 'card',
          variant: 'primary',
        };
      case 'qr':
        return {
          title: 'Verify Payment Status',
          amount: null,
          icon: 'refresh',
          variant: 'secondary',
        };
      case 'mobile_money':
        return {
          title: `Request Prompt`,
          amount: formattedAmount,
          icon: 'phone-portrait',
          variant: 'primary',
        };
      case 'cash':
        return {
          title: isDriver ? 'Confirm Cash Collected' : 'Confirm Cash Payment',
          amount: formattedAmount,
          icon: 'cash',
          variant: 'success',
        };
      default:
        return {
          title: `Pay Now`,
          amount: formattedAmount,
          icon: 'card',
          variant: 'primary',
        };
    }
  }, [paymentMethod, formattedAmount, isDriver]);

  // Main payment form body
  const formContent = (
    <View style={styles.formContentContainer}>
      {/* Fare Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryTopRow}>
          <View style={styles.passengerCol}>
            <Text style={styles.summaryLabel}>TRIP FARE</Text>
            <Text style={styles.passengerText}>
              {passengerName} • Ride #{rideId}
            </Text>
          </View>
          <View style={styles.amountCol}>
            <Text style={styles.fareAmount}>{formattedAmount}</Text>
          </View>
        </View>

        {/* Route Details */}
        <View style={styles.routeBox}>
          <View style={styles.routeRow}>
            <View style={styles.pickupDot} />
            <Text numberOfLines={1} style={styles.routeAddress}>
              {pickup}
            </Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <View style={styles.dropSquare} />
            <Text numberOfLines={1} style={styles.routeAddress}>
              {destination}
            </Text>
          </View>
        </View>

        <View style={styles.tripMetaRow}>
          <View style={styles.metaItem}>
            <Icon name="speedometer" size={13} color={COLORS.textLight} />
            <Text style={styles.metaText}>{distance}</Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="time" size={13} color={COLORS.textLight} />
            <Text style={styles.metaText}>{duration}</Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="car" size={13} color={COLORS.textLight} />
            <Text style={styles.metaText}>{vehicleType}</Text>
          </View>
        </View>
      </View>

      {/* 4 Selectable Payment Methods */}
      <PaymentMethodSelector
        selectedMethod={paymentMethod}
        onSelectMethod={handleSelectMethod}
        disabled={paymentStatus === 'processing'}
      />

      {/* Active Method Form Section */}
      {paymentMethod === 'card' && (
        <CardPaymentForm
          cardData={cardData}
          onChangeCardData={setCardData}
          errors={errors}
          disabled={paymentStatus === 'processing'}
        />
      )}

      {paymentMethod === 'qr' && (
        <QRCodePayment
          amount={totalFare}
          currency={currency}
          qrStatus={qrStatus}
          onCheckStatus={handleCheckQRStatus}
          checking={checkingQR}
          onSimulateSuccess={() => {
            setQrStatus('success');
            setTransactionId(`TXN_QR_SIM_${Date.now()}`);
            setPaymentStatus('success');
            if (isDriver) {
              dispatch(driverCompleteTrip({ rideId }));
            }
          }}
          disabled={paymentStatus === 'processing'}
        />
      )}

      {paymentMethod === 'mobile_money' && (
        <MobileMoneyForm
          mobileData={mobileData}
          onChangeMobileData={setMobileData}
          errors={errors}
          disabled={paymentStatus === 'processing'}
        />
      )}

      {paymentMethod === 'cash' && (
        <CashPayment
          amount={totalFare}
          currency={currency}
          note={cashNote}
          onChangeNote={setCashNote}
          isDriver={isDriver}
          status={paymentStatus === 'success' ? 'success' : 'idle'}
          disabled={paymentStatus === 'processing'}
        />
      )}

      {/* Main Action Submit Button */}
      <View style={styles.btnWrapper}>
        <PaymentButton
          title={actionButtonProps.title}
          amount={actionButtonProps.amount}
          icon={actionButtonProps.icon}
          variant={actionButtonProps.variant}
          loading={paymentStatus === 'processing'}
          disabled={paymentStatus === 'processing'}
          onPress={handlePrimaryPaymentAction}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <Header
        title="Payment Method"
        showBack={true}
        onBackPress={() => {
          if (paymentStatus === 'processing') return;
          navigation.goBack();
        }}
      />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 24, 32) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {formContent}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Payment Status Modal (Loading / Success / Failed / Pending) */}
      <PaymentStatus
        visible={paymentStatus !== 'idle'}
        status={paymentStatus}
        method={paymentMethod}
        amount={totalFare}
        currency={currency}
        transactionId={transactionId}
        errorMessage={errorMessage}
        isDriver={isDriver}
        onClose={() => setPaymentStatus('idle')}
        onPrimaryAction={handleFinishPayment}
        onRetry={() => {
          setPaymentStatus('idle');
          handlePrimaryPaymentAction();
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  formContentContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  passengerCol: {
    flex: 1,
  },
  summaryLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(10),
    fontWeight: '800',
    color: COLORS.textLight,
    letterSpacing: 0.8,
  },
  passengerText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  fareAmount: {
    ...TYPOGRAPHY.h2,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  routeBox: {
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.medium,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.sm,
  },
  dropSquare: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: COLORS.danger,
    marginRight: SPACING.sm,
  },
  routeLine: {
    width: 1.5,
    height: 10,
    backgroundColor: COLORS.border,
    marginLeft: 3,
    marginVertical: 2,
  },
  routeAddress: {
    flex: 1,
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '600',
  },
  tripMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  btnWrapper: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
});

export default PaymentMethodScreen;
