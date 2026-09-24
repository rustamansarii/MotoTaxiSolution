import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { KeyboardTextInput } from '../../components/keyboard/KeyboardTextInput';
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

export const DriverArrivedScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { isSplitLayout, insets } = useResponsive();
  const pickup = route.params?.pickup || 'Corner of 5th Ave & 59th St';
  const destination = route.params?.destination || 'JFK Terminal 4';
  const passengerName = route.params?.passengerName || 'Elena Rostova';
  const estimatedFare = route.params?.estimatedFare || 28.5;

  const [waitTimer, setWaitTimer] = useState(300); // 5 mins in seconds
  const [enteredPin, setEnteredPin] = useState('4821');

  useEffect(() => {
    if (waitTimer <= 0) return;
    const interval = setInterval(() => setWaitTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [waitTimer]);

  const formatWait = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleStartTrip = () => {
    navigation.replace('DriverTrip', {
      pickup,
      destination,
      passengerName,
      estimatedFare,
    });
  };

  const mapPane = (
    <View style={isSplitLayout ? styles.mapAreaSplit : styles.mapArea}>
      <MapPlaceholder
        showRoute={false}
        showPickupMarker={true}
        showDestinationMarker={false}
        showDriverMarker={true}
        pickupLabel={pickup}
        height="100%"
      />

      {/* Floating Wait Timer */}
      <View
        style={[
          styles.waitBadge,
          { top: Math.max(insets.top + 10, 30) },
        ]}
      >
        <Icon name="clock" size={16} color={COLORS.primary} />
        <Text style={styles.waitText}>
          Waiting for rider: {formatWait(waitTimer)}
        </Text>
      </View>
    </View>
  );

  const pinSheetPane = (
    <View
      style={[
        styles.sheet,
        isSplitLayout && styles.sideSheet,
        !isSplitLayout && {
          paddingBottom: Math.max(insets.bottom + SPACING.md, SPACING.xl),
        },
      ]}
    >
        <View style={styles.header}>
          <Text style={styles.title}>Rider Notified of Arrival</Text>
          <Text style={styles.subtitle}>
            Ask {passengerName} for their 4-digit ride verification PIN before departing.
          </Text>
        </View>

        {/* PIN Inputs */}
        <View style={styles.pinSection}>
          <Text style={styles.pinLabel}>Enter Rider PIN</Text>
          <View style={styles.pinRow}>
            {[0, 1, 2, 3].map((idx) => {
              const digit = enteredPin[idx] || '';
              return (
                <View
                  key={idx}
                  style={[
                    styles.pinBox,
                    digit ? styles.pinBoxFilled : null,
                  ]}
                >
                  <Text style={styles.pinDigit}>{digit}</Text>
                </View>
              );
            })}
          </View>

          <KeyboardTextInput
            id="driver-pin-input"
            value={enteredPin}
            onChangeText={(t) => {
              if (t.length <= 4) setEnteredPin(t);
            }}
            keyboardType="number-pad"
            maxLength={4}
            style={styles.hiddenInput}
          />
        </View>

        {/* Start Trip CTA */}
        <CustomButton
          title={t('driver.startTrip').toUpperCase()}
          onPress={handleStartTrip}
          disabled={enteredPin.length < 4}
          variant="primary"
          icon="navigation"
          iconPosition="right"
          style={styles.startBtn}
        />

        <CustomButton
          title={t('driver.viewMap').toUpperCase()}
          onPress={() => navigation.replace('DriverMap')}
          disabled={enteredPin.length < 4}
          variant="ghost"
          size="small"
          icon="navigation"
          style={{ marginTop: 6 }}
        />
      </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <AdaptiveSplitView
        primaryPane={mapPane}
        secondaryPane={
          isSplitLayout ? (
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
            >
              {pinSheetPane}
            </ScrollView>
          ) : (
            pinSheetPane
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
  mapArea: {
    height: '46%',
    position: 'relative',
  },
  mapAreaSplit: {
    flex: 1,
    height: '100%',
    position: 'relative',
  },
  waitBadge: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  waitText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: SPACING.xs,
  },
  sheet: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.extraLarge,
    borderTopRightRadius: RADIUS.extraLarge,
    padding: SPACING.xl,
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  sideSheet: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderLeftWidth: 1,
    borderTopWidth: 0,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  pinSection: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  pinLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  pinRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  pinBox: {
    width: 54,
    height: 58,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.inputBg,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBoxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  pinDigit: {
    ...TYPOGRAPHY.h2,
    fontWeight: '800',
    color: COLORS.text,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  startBtn: {
    width: '100%',
  },
  langFloating: {
    position: 'absolute',
    right: SPACING.md,
    zIndex: 99,
  },
});

export default DriverArrivedScreen;
