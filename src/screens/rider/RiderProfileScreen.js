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
import ProfileAvatar from '../../components/ProfileAvatar';
import CustomModal from '../../components/CustomModal';
import Icon from '../../components/Icon';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import LanguageButton from '../../components/LanguageButton';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '../../utils/responsive';

const MENU_ITEMS = [
  {
    id: 'places',
    icon: 'map-pin',
    title: 'Saved Places',
    subtitle: 'Manage Home, Work, and favorite spots',
  },
  {
    id: 'safety',
    icon: 'shield',
    title: 'Safety Toolkit',
    subtitle: 'Emergency contacts & ride sharing PIN',
  },
  {
    id: 'notifications',
    icon: 'bell',
    title: 'Notifications & Alerts',
    subtitle: 'Push notifications, trip updates, deals',
  },
  {
    id: 'privacy',
    icon: 'settings',
    title: 'Privacy & Security',
    subtitle: 'Password, biometric login, 2FA',
  },
  {
    id: 'help',
    icon: 'info',
    title: 'Help & Support',
    subtitle: 'Trip issues, lost items, contact support',
  },
];

export const RiderProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { isFoldableOrTablet, isSplitLayout, insets } = useResponsive();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(false);
    navigation.replace('RoleSelection');
  };

  const handleSwitchToDriver = () => {
    navigation.navigate('DriverNav');
  };

  const isMultiColumn = isFoldableOrTablet || isSplitLayout;

  const profileOverview = (
    <>
      {/* User Card */}
      <View style={styles.userCard}>
        <ProfileAvatar
          name="Alex Morgan"
          size={76}
          showEdit={true}
          onEditPress={() => {}}
        />

        <View style={styles.userInfo}>
          <Text style={styles.userName}>Alex Morgan</Text>
          <Text style={styles.userEmail}>alex.morgan@example.com</Text>

          <View style={styles.badgesRow}>
            <View style={styles.scoreBadge}>
              <Icon name="star" size={12} color={COLORS.primary} />
              <Text style={styles.scoreText}>4.98 Rating</Text>
            </View>
            <View style={styles.tripsBadge}>
              <Text style={styles.tripsBadgeText}>128 Trips</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Switch to Driver Role Banner */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleSwitchToDriver}
        style={styles.switchBanner}
      >
        <View style={styles.bannerIconCircle}>
          <Icon name="bike" size={20} color={COLORS.primary} />
        </View>
        <View style={styles.bannerInfo}>
          <Text style={styles.bannerTitle}>Earn Money as a Driver</Text>
          <Text style={styles.bannerSubtitle}>
            Switch to driver mode or complete partner signup.
          </Text>
        </View>
        <Icon name="arrow-right" size={18} color={COLORS.text} />
      </TouchableOpacity>
    </>
  );

  const menuList = (
    <View style={styles.menuCard}>
      {MENU_ITEMS.map((item, index) => (
        <TouchableOpacity
          key={item.id}
          activeOpacity={0.7}
          style={[
            styles.menuItem,
            index === MENU_ITEMS.length - 1 && styles.noBorder,
          ]}
        >
          <View style={styles.menuIconBox}>
            <Icon name={item.icon} size={18} color={COLORS.secondPrimary} />
          </View>

          <View style={styles.menuTextCol}>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text numberOfLines={1} style={styles.menuSubtitle}>
              {item.subtitle}
            </Text>
          </View>

          <Icon name="chevron-right" size={16} color={COLORS.iconLight} />
        </TouchableOpacity>
      ))}
    </View>
  );

  const footerActions = (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setShowLogoutModal(true)}
        style={styles.logoutBtn}
      >
        <Icon name="close" size={16} color={COLORS.danger} />
        <Text style={styles.logoutText}>{t('rider.logout')}</Text>
      </TouchableOpacity>

      <Text style={styles.appVersion}>Moto Taxi App Version 2.4.0 (Build 182)</Text>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ResponsiveContainer maxWidth={920} style={{ flex: 1 }}>
        <Header
          title={t('rider.profile')}
          showBack={false}
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
                {profileOverview}
                {footerActions}
              </View>
              <View style={styles.splitCol}>
                {menuList}
              </View>
            </View>
          ) : (
            <>
              {profileOverview}
              {menuList}
              {footerActions}
            </>
          )}
        </ScrollView>
      </ResponsiveContainer>

      {/* Logout Modal */}
      <CustomModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title={t('rider.logout')}
        message="Are you sure you want to log out? You will need to sign in again to book rides."
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
  userCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  userName: {
    ...TYPOGRAPHY.title,
    fontWeight: '800',
    color: COLORS.text,
  },
  userEmail: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.small,
  },
  scoreText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 3,
  },
  tripsBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.small,
  },
  tripsBadgeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primaryDark,
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
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  bannerInfo: {
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
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  menuIconBox: {
    width: 38,
    height: 38,
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
  menuSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.inputBg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.large,
    marginBottom: SPACING.lg,
  },
  logoutText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.danger,
    marginLeft: SPACING.xs,
  },
  appVersion: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});

export default RiderProfileScreen;
