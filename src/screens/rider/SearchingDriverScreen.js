import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import MapPlaceholder from '../../components/MapPlaceholder';
import CustomButton from '../../components/CustomButton';
import CustomModal from '../../components/CustomModal';
import Icon from '../../components/Icon';
import AdaptiveSplitView from '../../components/AdaptiveSplitView';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '../../utils/responsive';
import { formatCurrency } from '../../utils/formatters';
import { ACTIVE_MOCK_DRIVER } from '../../data/mockDrivers';

export const SearchingDriverScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { isSplitLayout, insets } = useResponsive();
  const selectedRide = route.params?.selectedRide;
  const totalFare = route.params?.totalFare || 18.5;

  const [showCancelModal, setShowCancelModal] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.35,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    // Auto-transition to DriverAssigned after 2.6s
    const timer = setTimeout(() => {
      navigation.replace('DriverAssigned', {
        driver: ACTIVE_MOCK_DRIVER,
        selectedRide,
        totalFare,
      });
    }, 2600);

    return () => {
      animation.stop();
      clearTimeout(timer);
    };
  }, [navigation, pulseAnim, selectedRide, totalFare]);

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    navigation.navigate('RiderHome');
  };

  const mapPane = (
    <View style={styles.mapArea}>
      <MapPlaceholder
        showRoute={true}
        showPickupMarker={true}
        showDestinationMarker={false}
        showDriverMarker={true}
        height="100%"
      />

      {/* Pulsating Radar Overlay */}
      <View style={styles.radarContainer}>
        <Animated.View
          style={[
            styles.pulseCircle,
            { transform: [{ scale: pulseAnim }] },
          ]}
        />
        <View style={styles.radarCore}>
          <Icon name="bike" size={24} color={COLORS.white} />
        </View>
      </View>
    </View>
  );

  const statusPane = (
    <View
      style={[
        styles.statusCard,
        isSplitLayout && styles.sideStatusCard,
        !isSplitLayout && {
          paddingBottom: Math.max(insets.bottom + SPACING.lg, SPACING.xl),
        },
      ]}
    >
      <View style={styles.statusHeader}>
        <Text style={styles.statusTitle}>{t('rider.searchingDriversTitle')}</Text>
        <Text style={styles.statusSubtitle}>
          {t('rider.searchingSubtitle')}
        </Text>
      </View>

      {/* Progress bar line */}
      <View style={styles.progressTrack}>
        <View style={styles.progressFill} />
      </View>

      {/* Ride specs info */}
      <View style={styles.infoRow}>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>{t('driver.vehicleInfo')}</Text>
          <Text style={styles.infoValue}>
            {selectedRide?.name || 'Moto Taxi Standard'}
          </Text>
        </View>
        <View style={styles.infoColRight}>
          <Text style={styles.infoLabel}>{t('rider.estimatedFare')}</Text>
          <Text style={styles.infoValue}>{formatCurrency(totalFare)}</Text>
        </View>
      </View>

      {/* Cancel Button */}
      <CustomButton
        title={t('rider.cancelRequest')}
        variant="outline"
        onPress={() => setShowCancelModal(true)}
        style={styles.cancelBtn}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <AdaptiveSplitView
        primaryPane={mapPane}
        secondaryPane={statusPane}
        primaryRatio={0.6}
      />

      {/* Cancel Confirmation Modal */}
      <CustomModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title={t('rider.cancelModalTitle')}
        message={t('rider.cancelModalMessage')}
        confirmText={t('rider.yesCancel')}
        cancelText={t('rider.keepWaiting')}
        isDanger={true}
        onConfirm={handleConfirmCancel}
        icon="alert-triangle"
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
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
    borderColor: COLORS.primary,
    opacity: 0.7,
  },
  radarCore: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.secondPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  statusCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.extraLarge,
    borderTopRightRadius: RADIUS.extraLarge,
    padding: SPACING.xl,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  sideStatusCard: {
    height: '100%',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderLeftWidth: 1,
    borderTopWidth: 0,
    justifyContent: 'center',
  },
  statusHeader: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statusTitle: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.round,
    overflow: 'hidden',
    marginVertical: SPACING.md,
  },
  progressFill: {
    width: '65%',
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.inputBg,
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.lg,
  },
  infoCol: {
    flex: 1,
  },
  infoColRight: {
    alignItems: 'flex-end',
  },
  infoLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  infoValue: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  cancelBtn: {
    width: '100%',
  },
  langFloating: {
    position: 'absolute',
    right: SPACING.md,
    zIndex: 99,
  },
});

export default SearchingDriverScreen;
