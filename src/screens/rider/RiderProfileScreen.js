import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import ProfileAvatar from '../../components/ProfileAvatar';
import CustomModal from '../../components/CustomModal';
import Icon from '../../components/Icon';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import LanguageModal from '../../components/LanguageModal';
import LanguageButton from '../../components/LanguageButton';
import { useApp } from '../../context/AppContext';
import { useResponsive } from '../../utils/responsive';
import { clearTokens } from '../../utils/storage';
import { fetchUserProfile } from '../../redux/features/auth/authSlice';
import { useFocusEffect } from '@react-navigation/native';

/* ------------------------------------------------------------------ */
/* Menu config — grouped, i18n-keyed, with per-item accent colors      */
/* ------------------------------------------------------------------ */
const MENU_SECTIONS = [
  {
    id: 'account',
    titleKey: 'rider.menu.sections.account',
    titleDefault: 'Account',
    items: [
      {
        id: 'personal_details',
        icon: 'user',
        iconBg: '#EEF2FF',
        iconColor: '#4F46E5',
        titleKey: 'rider.menu.personalDetails.title',
        titleDefault: 'Personal Details',
        subtitleKey: 'rider.menu.personalDetails.subtitle',
        subtitleDefault: 'Manage profile, email, and phone',
      },
      {
        id: 'places',
        icon: 'map-pin',
        iconBg: '#ECFDF5',
        iconColor: '#059669',
        titleKey: 'rider.menu.savedPlaces.title',
        titleDefault: 'Saved Places',
        subtitleKey: 'rider.menu.savedPlaces.subtitle',
        subtitleDefault: 'Manage Home, Work, and favorites',
      },
      {
        id: 'privacy',
        icon: 'shield',
        iconBg: '#F0FDF4',
        iconColor: '#16A34A',
        titleKey: 'rider.menu.privacy.title',
        titleDefault: 'Privacy & Security',
        subtitleKey: 'rider.menu.privacy.subtitle',
        subtitleDefault: 'Data safety and account security',
      },
    ],
  },
  {
    id: 'preferences',
    titleKey: 'settings.preferences',
    titleDefault: 'Preferences',
    items: [
      {
        id: 'language',
        icon: 'globe',
        iconBg: '#ECFDF5',
        iconColor: '#059669',
        titleKey: 'settings.language',
        titleDefault: 'Language',
        subtitleKey: 'common.switchLanguage',
        subtitleDefault: 'Switch Language',
      },
    ],
  },
  {
    id: 'support',
    titleKey: 'rider.menu.sections.support',
    titleDefault: 'Support',
    items: [
      {
        id: 'help',
        icon: 'info',
        iconBg: '#FFF7ED',
        iconColor: '#EA580C',
        titleKey: 'rider.menu.help.title',
        titleDefault: 'Help & Support',
        subtitleKey: 'rider.menu.help.subtitle',
        subtitleDefault: 'Trip issues, lost items, contact us',
      },
    ],
  },
  {
    id: 'danger',
    titleKey: 'rider.menu.sections.danger',
    titleDefault: 'Danger Zone',
    items: [
      {
        id: 'delete_account',
        icon: 'alert-triangle',
        iconBg: '#FEF2F2',
        iconColor: COLORS.danger,
        titleKey: 'rider.menu.deleteAccount.title',
        titleDefault: 'Delete Account',
        subtitleKey: 'rider.menu.deleteAccount.subtitle',
        subtitleDefault: 'Permanently close and delete your account',
        isDanger: true,
      },
    ],
  },
];

const APP_VERSION = '1.0 (1)';

export const RiderProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { isFoldableOrTablet, isSplitLayout, insets } = useResponsive();
  const { language } = useApp();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const authUser = useSelector((s) => s.auth?.user);
  const riderProfile = useSelector((s) => s.auth?.riderProfile);

  // Re-fetch latest user profile on mount and whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchUserProfile());
    }, [dispatch])
  );

  /* -------------------- Derived display values -------------------- */
  const currentLanguageInfo = useMemo(() => {
    if (language === 'hi') {
      return { flag: '🇮🇳', name: 'हिन्दी' };
    }
    if (language === 'fr') {
      return { flag: '🇫🇷', name: 'Français' };
    }
    return { flag: '🇺🇸', name: 'English' };
  }, [language]);

  const displayName = useMemo(() => {
    const raw =
      authUser?.full_name ||
      (authUser?.first_name
        ? `${authUser.first_name} ${authUser.last_name || ''}`.trim()
        : null) ||
      authUser?.name;
    if (!raw) return t('rider.fallbackName', 'Rider');
    return raw
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }, [authUser, t]);

  const displayEmail = authUser?.email || '';
  const displayPhone =
    authUser?.phone_number ||
    authUser?.phone ||
    authUser?.emergency_contact_phone ||
    '';
  const displayEmergencyPhone = authUser?.emergency_contact_phone || '';

  const ratingValue = riderProfile?.rating_avg ?? authUser?.rating ?? null;
  const displayRating = ratingValue != null ? Number(ratingValue).toFixed(2) : null;
  const tripsCount = riderProfile?.total_rides ?? 0;
  const displayTrips = t('rider.tripsCount', '{{count}} Trips', { count: tripsCount });

  const memberSince = useMemo(() => {
    const raw = authUser?.created_at || authUser?.date_joined;
    if (!raw) return null;
    try {
      const locale = language === 'fr' ? 'fr-FR' : language === 'hi' ? 'hi-IN' : 'en-US';
      return new Date(raw).toLocaleDateString(locale, {
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  }, [authUser, language]);

  const avatarPhoto = authUser?.profile_photo;

  /* ----------------------------- Handlers ------------------------- */
  const handleLogout = useCallback(async () => {
    setShowLogoutModal(false);
    await clearTokens();
    navigation.replace('Login');
  }, [navigation]);

  const handleMenuPress = useCallback(
    (item) => {
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
        case 'language':
          setShowLanguageModal(true);
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
    },
    [navigation]
  );

  const isMultiColumn = isFoldableOrTablet || isSplitLayout;

  /* --------------------------- Sub-views -------------------------- */
  const profileCard = (
    <View style={styles.profileCard}>
      <View style={styles.avatarWrap}>
        <ProfileAvatar
          imageUri={avatarPhoto}
          name={displayName}
          size={84}
          showEdit
          onEditPress={() => navigation.navigate('PersonalDetails')}
        />
      </View>

      <Text style={styles.userName} numberOfLines={1}>
        {displayName}
      </Text>

      {displayEmail ? (
        <Text style={styles.userContact} numberOfLines={1}>
          {displayEmail}
        </Text>
      ) : null}
      {displayPhone ? (
        <Pressable
          onPress={() => navigation.navigate('PersonalDetails')}
          hitSlop={6}
        >
          <Text style={styles.userContact} numberOfLines={1}>
            {displayPhone}
          </Text>
        </Pressable>
      ) : null}
      {displayEmergencyPhone && displayEmergencyPhone !== displayPhone ? (
        <Pressable
          onPress={() => navigation.navigate('PersonalDetails')}
          hitSlop={6}
        >
          <Text style={styles.userContactSub} numberOfLines={1}>
            {t('rider.emergencyContact', 'Emergency Contact')}: {displayEmergencyPhone}
          </Text>
        </Pressable>
      ) : null}

      {/* Stats */}
      <View style={styles.statsRow}>
        <Stat
          icon="star"
          iconColor="#F59E0B"
          value={displayRating ?? t('rider.newRider', 'New')}
          label={t('rider.rating', 'Rating')}
        />
        <View style={styles.statDivider} />
        <Stat
          icon="navigation"
          iconColor={COLORS.primary}
          value={String(tripsCount)}
          label={t('rider.trips', 'Trips')}
        />
        <View style={styles.statDivider} />
        <Stat
          icon="calendar"
          iconColor="#7C3AED"
          value={memberSince ?? '—'}
          label={t('rider.memberSince', 'Member')}
        />
      </View>
    </View>
  );

  const menuList = (
    <View>
      {MENU_SECTIONS.map((section) => (
        <View key={section.id} style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t(section.titleKey, section.titleDefault)}
          </Text>

          <View style={styles.menuCard}>
            {section.items.map((item, index) => {
              const isDanger = item.isDanger;
              const isLast = index === section.items.length - 1;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleMenuPress(item)}
                  accessibilityRole="button"
                  accessibilityLabel={t(item.titleKey, item.titleDefault)}
                  style={({ pressed }) => [
                    styles.menuItem,
                    !isLast && styles.menuItemBorder,
                    pressed && styles.menuItemPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.menuIconBox,
                      { backgroundColor: item.iconBg },
                    ]}
                  >
                    <Icon name={item.icon} size={18} color={item.iconColor} />
                  </View>

                  <View style={styles.menuTextCol}>
                    <Text
                      style={[
                        styles.menuTitle,
                        isDanger && styles.dangerText,
                      ]}
                    >
                      {t(item.titleKey, item.titleDefault)}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={styles.menuSubtitle}
                    >
                      {t(item.subtitleKey, item.subtitleDefault)}
                    </Text>
                  </View>

                  {item.id === 'language' ? (
                    <View style={styles.langBadgePill}>
                      <Text style={styles.langBadgePillFlag}>{currentLanguageInfo.flag}</Text>
                      <Text style={styles.langBadgePillText}>{currentLanguageInfo.name}</Text>
                    </View>
                  ) : null}

                  <Icon
                    name="chevron-right"
                    size={18}
                    color={isDanger ? COLORS.danger : COLORS.iconLight}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );

  const footerActions = (
    <View style={styles.footer}>
      <Pressable
        onPress={() => setShowLogoutModal(true)}
        accessibilityRole="button"
        accessibilityLabel={t('rider.logout', 'Log Out')}
        style={({ pressed }) => [
          styles.logoutBtn,
          pressed && styles.logoutBtnPressed,
        ]}
      >
        <Icon name="log-out" size={18} color={COLORS.danger} />
        <Text style={styles.logoutText}>
          {t('rider.logout', 'Log Out')}
        </Text>
      </Pressable>

      <Text style={styles.appVersion}>
        {t('rider.appVersion', 'Moto Taxi · v{{version}}', { version: APP_VERSION })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ResponsiveContainer maxWidth={920} style={{ flex: 1 }}>
        <Header
          title={t('rider.profile', 'Profile')}
          showBack={false}
          centerTitle={true}
      
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom: Math.max(
                insets.bottom + SPACING.lg,
                SPACING.xxxl
              ),
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {isMultiColumn ? (
            <View style={styles.splitRow}>
              <View style={styles.splitCol}>
                {profileCard}
                {footerActions}
              </View>
              <View style={styles.splitCol}>{menuList}</View>
            </View>
          ) : (
            <>
              {profileCard}
              {menuList}
              {footerActions}
            </>
          )}
        </ScrollView>
      </ResponsiveContainer>

      {/* Logout */}
      <CustomModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title={t('rider.logoutTitle', 'Log out?')}
        message={t(
          'rider.logoutMessage',
          'You will need to sign in again to book rides.'
        )}
        confirmText={t('rider.logout', 'Log Out')}
        cancelText={t('common.cancel', 'Cancel')}
        isDanger
        onConfirm={handleLogout}
        icon="log-out"
      />

      {/* Privacy */}
      <CustomModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title={t('rider.privacy.title', 'Privacy & Security')}
        message={t(
          'rider.privacy.message',
          'Your account is protected by industry-standard encryption, tokenized authentication, and device biometrics. You can manage access permissions in your system settings.'
        )}
        confirmText={t('common.understood', 'Understood')}
        showCancel={false}
        onConfirm={() => setShowPrivacyModal(false)}
        icon="shield"
      />

      {/* Help */}
      <CustomModal
        visible={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title={t('rider.help.title', 'Help & Support')}
        message={t(
          'rider.help.message',
          'Need help with a trip or lost item? Our 24/7 support team is available via in-app chat or at support@mototaxi.com.'
        )}
        confirmText={t('common.gotIt', 'Got it')}
        showCancel={false}
        onConfirm={() => setShowHelpModal(false)}
        icon="info"
      />

      {/* Language Selection */}
      <LanguageModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />
    </SafeAreaView>
  );
};

/* ---------------------------- Stat pill --------------------------- */
const Stat = ({ icon, iconColor, value, label }) => (
  <View style={styles.stat}>
    <Icon name={icon} size={14} color={iconColor} />
    <Text style={styles.statValue} numberOfLines={1}>
      {value}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

/* ------------------------------ Styles ---------------------------- */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },

  /* Split layout */
  splitRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    alignItems: 'flex-start',
  },
  splitCol: { flex: 1 },

  /* Profile card */
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    // Soft shadow
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 3 },
    }),
  },
  avatarWrap: {
    marginTop: -SPACING.xs,
    marginBottom: SPACING.sm,
  },
  userName: {
    ...TYPOGRAPHY.title,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  userContact: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
    textAlign: 'center',
  },
  userContactSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryDark || COLORS.textLight,
    marginTop: 2,
    textAlign: 'center',
    fontSize: 12,
  },

  /* Stats */
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignSelf: 'stretch',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: COLORS.text,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
  },

  /* Menu */
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 2 },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemPressed: {
    backgroundColor: COLORS.inputBg,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  menuTextCol: { flex: 1 },
  menuTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  dangerText: { color: COLORS.danger },
  menuSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  langBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
    marginRight: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  langBadgePillFlag: {
    fontSize: 12,
    marginRight: 4,
    includeFontPadding: false,
  },
  langBadgePillText: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    includeFontPadding: false,
  },

  /* Footer */
  footer: {
    marginTop: SPACING.xs,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.large,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  logoutBtnPressed: {
    backgroundColor: '#FEF2F2',
    transform: [{ scale: 0.99 }],
  },
  logoutText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.danger,
  },
  appVersion: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});

export default RiderProfileScreen;