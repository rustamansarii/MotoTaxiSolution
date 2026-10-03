import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
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
import { clearTokens } from '../../utils/storage';
import { fetchUserProfile } from '../../redux/features/auth/authSlice';

const MENU_ITEMS = [
  {
    id: 'personal_details',
    icon: 'user',
    title: 'Personal Details',
    subtitle: 'Manage profile, email, and phone',
  },
  {
    id: 'places',
    icon: 'map-pin',
    title: 'Saved Places',
    subtitle: 'Manage Home, Work, and favorite spots',
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
  {
    id: 'delete_account',
    icon: 'alert-triangle',
    title: 'Delete Account',
    subtitle: 'Permanently close and delete your account',
    isDanger: true,
  },
];

export const RiderProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { isFoldableOrTablet, isSplitLayout, insets } = useResponsive();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const authUser = useSelector((state) => state.auth?.user);
  const riderProfile = useSelector((state) => state.auth?.riderProfile);

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  const displayName = useMemo(() => {
    const raw =
      authUser?.full_name ||
      (authUser?.first_name ? `${authUser.first_name} ${authUser.last_name || ''}`.trim() : null) ||
      authUser?.name;
    if (raw) {
      return raw
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
    return 'Rider';
  }, [authUser]);

  const displayEmail = authUser?.email || '';
  const displayPhone = authUser?.phone_number || authUser?.phone || '';
  const displayRating = riderProfile?.rating_avg || authUser?.rating || '5.00';
  const displayTrips =
    riderProfile?.total_rides !== undefined
      ? `${riderProfile.total_rides} Trips`
      : '0 Trips';
  const avatarPhoto = authUser?.profile_photo;

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await clearTokens();
    navigation.replace('RoleSelection');
  };

  const handleMenuPress = (item) => {
    switch (item.id) {
      case 'personal_details':
        navigation.navigate('PersonalDetails');
        break;
      case 'places':
        navigation.navigate('SavedPlaces');
        break;
      case 'privacy':
        setShowPrivacyModal(true);
        break;
      case 'help':
        setShowHelpModal(true);
        break;
      case 'delete_account':
        navigation.navigate('DeleteAccount');
        break;
      default:
        break;
    }
  };

  const isMultiColumn = isFoldableOrTablet || isSplitLayout;

  const profileOverview = (
    <View style={styles.userCard}>
      <ProfileAvatar
        imageUri={avatarPhoto}
        name={displayName}
        size={76}
        showEdit={true}
        onEditPress={() => navigation.navigate('PersonalDetails')}
      />

      <View style={styles.userInfo}>
        <Text style={styles.userName}>{displayName}</Text>
        {displayEmail ? <Text style={styles.userEmail}>{displayEmail}</Text> : null}
        {displayPhone ? <Text style={styles.userPhone}>{displayPhone}</Text> : null}

        <View style={styles.badgesRow}>
          <View style={styles.scoreBadge}>
            <Icon name="star" size={12} color={COLORS.primary} />
            <Text style={styles.scoreText}>{displayRating} Rating</Text>
          </View>
          <View style={styles.tripsBadge}>
            <Text style={styles.tripsBadgeText}>{displayTrips}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const menuList = (
    <View style={styles.menuCard}>
      {MENU_ITEMS.map((item, index) => {
        const isDanger = item.isDanger;
        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            onPress={() => handleMenuPress(item)}
            style={[
              styles.menuItem,
              index === MENU_ITEMS.length - 1 && styles.noBorder,
              isDanger && styles.dangerMenuItem,
            ]}
          >
            <View
              style={[
                styles.menuIconBox,
                isDanger && styles.dangerMenuIconBox,
              ]}
            >
              <Icon
                name={item.icon}
                size={18}
                color={isDanger ? COLORS.danger : COLORS.secondPrimary}
              />
            </View>

            <View style={styles.menuTextCol}>
              <Text
                style={[
                  styles.menuTitle,
                  isDanger && styles.dangerMenuTitle,
                ]}
              >
                {item.title}
              </Text>
              <Text numberOfLines={1} style={styles.menuSubtitle}>
                {item.subtitle}
              </Text>
            </View>

            <Icon
              name="chevron-right"
              size={16}
              color={isDanger ? COLORS.danger : COLORS.iconLight}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const footerActions = (
    <>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => setShowLogoutModal(true)}
        style={styles.logoutBtn}
      >
        <Icon name="close" size={16} color={COLORS.danger} />
        <Text style={styles.logoutText}>{t('rider.logout', 'Log Out')}</Text>
      </TouchableOpacity>

      <Text style={styles.appVersion}>Moto Taxi App Version 2.4.0 (Build 182)</Text>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ResponsiveContainer maxWidth={920} style={{ flex: 1 }}>
        <Header
          title={t('rider.profile', 'Profile')}
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
        title={t('rider.logout', 'Log Out')}
        message="Are you sure you want to log out? You will need to sign in again to book rides."
        confirmText={t('rider.logout', 'Log Out')}
        cancelText={t('common.cancel', 'Cancel')}
        isDanger={true}
        onConfirm={handleLogout}
        icon="alert-triangle"
      />

      {/* Privacy & Security Modal */}
      <CustomModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Privacy & Security"
        message="Your account is protected by industry-standard encryption, tokenized authentication, and device biometrics. You can manage access permissions in your system settings."
        confirmText="Understood"
        showCancel={false}
        onConfirm={() => setShowPrivacyModal(false)}
        icon="shield"
      />

      {/* Help & Support Modal */}
      <CustomModal
        visible={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title="Help & Support"
        message="Need help with a trip or lost item? Our 24/7 dedicated support team is available via in-app chat, or reach out to support@mototaxi.com."
        confirmText="Got it"
        showCancel={false}
        onConfirm={() => setShowHelpModal(false)}
        icon="info"
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
    marginBottom: SPACING.lg,
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
  userPhone: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary || '#64748B',
    marginTop: 2,
    fontWeight: '500',
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
  dangerMenuItem: {},
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  dangerMenuIconBox: {
    backgroundColor: '#FEF2F2',
  },
  menuTextCol: {
    flex: 1,
  },
  menuTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  dangerMenuTitle: {
    color: COLORS.danger,
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
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.large,
    marginBottom: SPACING.md,
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
