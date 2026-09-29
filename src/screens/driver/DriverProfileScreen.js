import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import ProfileAvatar from '../../components/ProfileAvatar';
import CustomModal from '../../components/CustomModal';
import Icon from '../../components/Icon';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import LanguageButton from '../../components/LanguageButton';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '../../utils/responsive';
import { ACTIVE_MOCK_DRIVER } from '../../data/mockDrivers';
import { clearTokens, saveRole } from '../../utils/storage';

export const DriverProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { isFoldableOrTablet, isSplitLayout, insets } = useResponsive();
  const driver = ACTIVE_MOCK_DRIVER;
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await clearTokens();
    navigation.replace('RoleSelection');
  };

  const handleSwitchToRider = async () => {
    await saveRole('RIDER');
    navigation.replace('RiderNav');
  };

  const isMultiColumn = isFoldableOrTablet || isSplitLayout;

  const driverOverview = (
    <>
      {/* Driver Hero Card */}
      <View style={styles.driverHeroCard}>
        <ProfileAvatar
          name={driver.name}
          size={80}
          isOnline={true}
          showStatus={true}
          showEdit={true}
        />

        <Text style={styles.driverName}>{driver.name}</Text>
        <Text style={styles.driverPhone}>{driver.phone}</Text>

        <View style={styles.statsPillsRow}>
          <View style={styles.statPill}>
            <Icon name="star" size={12} color={COLORS.primary} />
            <Text style={styles.statPillText}>{driver.rating} Rating</Text>
          </View>

          <View style={styles.statPill}>
            <Text style={styles.statPillText}>3,840 Trips</Text>
          </View>

          <View style={styles.statPill}>
            <Text style={styles.statPillText}>Top Partner</Text>
          </View>
        </View>
      </View>

      {/* Switch to Rider Mode Banner */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleSwitchToRider}
        style={styles.switchBanner}
      >
        <View style={styles.bannerIconCircle}>
          <Icon name="user" size={20} color={COLORS.secondPrimary} />
        </View>
        <View style={styles.bannerTextCol}>
          <Text style={styles.bannerTitle}>Switch to Rider Mode</Text>
          <Text style={styles.bannerSubtitle}>
            Need a ride yourself? Book a trip instantly as a passenger.
          </Text>
        </View>
        <Icon name="arrow-right" size={18} color={COLORS.text} />
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setShowLogoutModal(true)}
        style={styles.logoutBtn}
      >
        <Icon name="close" size={16} color={COLORS.danger} />
        <Text style={styles.logoutText}>{t('rider.logout')}</Text>
      </TouchableOpacity>
    </>
  );

  const driverDetails = (
    <>
      {/* Vehicle Information Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Active Vehicle</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('VehicleSetup')}
            style={styles.editLink}
          >
            <Text style={styles.editLinkText}>Manage</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.vehicleRow}>
          <View style={styles.vehicleIconCircle}>
            <Icon name="bike" size={22} color={COLORS.secondPrimary} />
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.carName}>{driver.car.model}</Text>
            <Text style={styles.carColor}>
              {driver.car.year} • {driver.car.color}
            </Text>
          </View>
          <View style={styles.plateBadge}>
            <Text style={styles.plateText}>{driver.car.plateNumber}</Text>
          </View>
        </View>
      </View>

      {/* Partner Menu Items */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Preferences & Documents</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('DocumentUpload')}
          style={styles.menuRow}
        >
          <View style={styles.menuIconBox}>
            <Icon name="document" size={18} color={COLORS.secondPrimary} />
          </View>
          <View style={styles.menuTextCol}>
            <Text style={styles.menuTitle}>Documents & Inspection</Text>
            <Text style={styles.menuSub}>Registration, Insurance & DMV</Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedBadgeText}>Verified</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} style={styles.menuRow}>
          <View style={styles.menuIconBox}>
            <Icon name="settings" size={18} color={COLORS.secondPrimary} />
          </View>
          <View style={styles.menuTextCol}>
            <Text style={styles.menuTitle}>Navigation Preferences</Text>
            <Text style={styles.menuSub}>In-app routing & voice guidance</Text>
          </View>
          <Icon name="chevron-right" size={16} color={COLORS.iconLight} />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} style={styles.menuRow}>
          <View style={styles.menuIconBox}>
            <Icon name="shield" size={18} color={COLORS.secondPrimary} />
          </View>
          <View style={styles.menuTextCol}>
            <Text style={styles.menuTitle}>Safety & Dashcam Toolkit</Text>
            <Text style={styles.menuSub}>Registered dashcam & emergency contact</Text>
          </View>
          <Icon name="chevron-right" size={16} color={COLORS.iconLight} />
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ResponsiveContainer maxWidth={920} style={{ flex: 1 }}>
        <Header
          title={t('driver.driverProfile')}
          showBack={false}
          variant="light"
          rightComponent={<LanguageButton />}
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + SPACING.lg, SPACING.xxxl) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {isMultiColumn ? (
            <View style={styles.splitRow}>
              <View style={styles.splitCol}>
                {driverOverview}
              </View>
              <View style={styles.splitCol}>
                {driverDetails}
              </View>
            </View>
          ) : (
            <>
              {driverOverview}
              {driverDetails}
            </>
          )}
        </ScrollView>
      </ResponsiveContainer>

      {/* Logout Modal */}
      <CustomModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title={t('rider.logout')}
        message="You will go offline and will not receive any ride requests while signed out."
        confirmText={t('rider.logout')}
        cancelText={t('common.cancel')}
        isDanger={true}
        onConfirm={handleLogout}
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
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  splitRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    alignItems: 'flex-start',
  },
  splitCol: {
    flex: 1,
  },
  driverHeroCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  driverName: {
    ...TYPOGRAPHY.h2,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  driverPhone: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  statsPillsRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statPillText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 3,
  },
  switchBanner: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  bannerIconCircle: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.secondPrimaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  bannerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    ...TYPOGRAPHY.title,
    fontWeight: '700',
    color: COLORS.text,
  },
  editLink: {
    padding: SPACING.xs,
  },
  editLinkText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.secondPrimary,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
  },
  vehicleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  carName: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  carColor: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  plateBadge: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  plateText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: COLORS.text,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  menuTextCol: {
    flex: 1,
  },
  menuTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  menuSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  verifiedBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.small,
  },
  verifiedBadgeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.large,
    marginVertical: SPACING.md,
  },
  logoutText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.danger,
    marginLeft: SPACING.xs,
  },
});

export default DriverProfileScreen;
