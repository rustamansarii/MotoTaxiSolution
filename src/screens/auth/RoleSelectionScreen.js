import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import CustomButton from '../../components/CustomButton';
import Icon from '../../components/Icon';
import { useResponsive, responsiveFont } from '../../utils/responsive';
import { useTranslation } from 'react-i18next';
import { LanguageButton } from '../../components/LanguageButton';
import { saveRole, setGuestMode } from '../../utils/storage';

const GREEN = '#17baa1';

export const RoleSelectionScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { isFoldableOrTablet, isLandscape, isCompact, insets } = useResponsive();
  const isGuest = Boolean(route?.params?.isGuest);
  const [selectedRole, setSelectedRole] = useState('rider');

  const handleProceed = async (roleOverride) => {
    const roleToUse = roleOverride || selectedRole || 'rider';
    if (isGuest) {
      try {
        await setGuestMode(true);
      } catch (e) {}
      if (roleToUse === 'rider') {
        try {
          await saveRole('RIDER');
        } catch (e) {}
        navigation.replace('RiderNav');
      } else {
        try {
          await saveRole('DRIVER');
        } catch (e) {}
        navigation.replace('DriverNav');
      }
      return;
    }

    if (roleToUse === 'rider') {
      navigation.navigate('RiderSignup');
    } else {
      navigation.navigate('DriverSignup');
    }
  };

  const handleRoleCardPress = (role) => {
    setSelectedRole(role);
    if (isGuest) {
      setTimeout(() => {
        handleProceed(role);
      }, 200);
    }
  };

  const handlePreview = () => {
    if (selectedRole === 'rider') {
      navigation.replace('RiderNav');
    } else {
      navigation.replace('DriverNav');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={GREEN}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* =========================================
            TOP BRAND AREA
        ========================================= */}

        <View style={styles.hero}>

          {/* Back to Login Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Login")}
            style={{
              position: 'absolute',
              top: Math.max(insets.top, 16),
              left: 16,
              zIndex: 20,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.22)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Language Selector Button */}
          <View
            style={{
              position: 'absolute',
              top: Math.max(insets.top, 16),
              right: 16,
              zIndex: 20,
            }}
          >
            <LanguageButton variant="dark" short={true} />
          </View>

          {/* Logo */}
          <View style={styles.logoBox}>
            <View style={styles.steeringWheel}>
              <View style={styles.wheelOuter} />

              <View style={styles.wheelCenter} />

              <View style={styles.leftSpoke} />

              <View style={styles.rightSpoke} />

              <View style={styles.bottomSpoke} />
            </View>
          </View>

          <Text style={styles.brandName}>
            Moto Taxi
          </Text>

          <Text style={styles.heroText}>
            {t('common.welcome', 'Welcome to Moto Taxi')}
          </Text>

          {/* Subtle skyline */}
          <View style={styles.skyline}>
            <Building height={45} width={18} />
            <Building height={70} width={24} />
            <Building height={40} width={18} />
            <Building height={82} width={26} />
            <Building height={58} width={21} />
            <Building height={75} width={24} />
            <Building height={48} width={18} />
            <Building height={65} width={23} />
            <Building height={42} width={18} />
            <Building height={76} width={25} />
            <Building height={52} width={20} />
            <Building height={68} width={24} />
          </View>
        </View>

        {/* =========================================
            MAIN CONTENT
        ========================================= */}

        <View style={[styles.content, { maxWidth: isFoldableOrTablet ? 680 : '100%', alignSelf: 'center', width: '100%' }]}>

          {isGuest && (
            <View style={styles.guestModePill}>
              <Icon name="user" size={14} color={GREEN} />
              <Text style={styles.guestModePillText}>
                {t('auth.guestMode', 'Guest Mode')}
              </Text>
            </View>
          )}

          <Text style={styles.title}>
            {isGuest
              ? t('auth.chooseRoleGuestTitle', 'Explore as Guest')
              : t('auth.chooseRoleTitle', 'Choose Your Role')}
          </Text>

          <Text style={styles.subtitle}>
            {isGuest
              ? t('auth.chooseRoleGuestSubtitle', 'Select a role to start exploring the app immediately.')
              : t('auth.chooseRoleSubtitle', 'How would you like to use Moto Taxi today?')}
          </Text>

          <View style={[styles.rolesContainer, (isFoldableOrTablet || isLandscape) && styles.rolesRow]}>
          {/* =======================================
              RIDER
          ======================================= */}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleRoleCardPress('rider')}
            style={[
              styles.roleCard,
              (isFoldableOrTablet || isLandscape) && styles.roleCardWide,
              selectedRole === 'rider' && styles.selectedCard,
            ]}
          >
            <View style={styles.roleIconContainer}>
              <Icon
                name="user"
                size={28}
                color={
                  selectedRole === 'rider'
                    ? GREEN
                    : '#555555'
                }
              />
            </View>

            <View style={styles.roleContent}>
              <View style={styles.roleTitleRow}>
                <Text style={styles.roleTitle}>
                  {t('auth.riderRoleTitle', 'Rider')}
                </Text>

                {selectedRole === 'rider' && (
                  <View style={styles.selectedBadge}>
                    <Icon
                      name="check"
                      size={13}
                      color="#FFFFFF"
                    />
                  </View>
                )}
              </View>

              <Text style={styles.roleDescription}>
                {t('auth.riderRoleDesc', 'Book a ride and get where you need to go safely and comfortably.')}
              </Text>
            </View>

            <View
              style={[
                styles.radio,
                selectedRole === 'rider' &&
                  styles.radioSelected,
              ]}
            >
              {selectedRole === 'rider' && (
                <View style={styles.radioDot} />
              )}
            </View>
          </TouchableOpacity>

          {/* =======================================
              DRIVER
          ======================================= */}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleRoleCardPress('driver')}
            style={[
              styles.roleCard,
              (isFoldableOrTablet || isLandscape) && styles.roleCardWide,
              selectedRole === 'driver' && styles.selectedCard,
            ]}
          >
            <View style={styles.roleIconContainer}>
              <Icon
                name="bike"
                size={29}
                color={
                  selectedRole === 'driver'
                    ? GREEN
                    : '#555555'
                }
              />
            </View>

            <View style={styles.roleContent}>
              <View style={styles.roleTitleRow}>
                <Text style={styles.roleTitle}>
                  {t('auth.driverRoleTitle', 'Driver')}
                </Text>

                {selectedRole === 'driver' && (
                  <View style={styles.selectedBadge}>
                    <Icon
                      name="check"
                      size={13}
                      color="#FFFFFF"
                    />
                  </View>
                )}
              </View>

              <Text style={styles.roleDescription}>
                {t('auth.driverRoleDesc', 'Drive with Moto Taxi, accept trips and earn money on your own schedule.')}
              </Text>
            </View>

            <View
              style={[
                styles.radio,
                selectedRole === 'driver' &&
                  styles.radioSelected,
              ]}
            >
              {selectedRole === 'driver' && (
                <View style={styles.radioDot} />
              )}
            </View>
          </TouchableOpacity>
          </View>

          {/* =======================================
              CONTINUE
          ======================================= */}

          <View style={styles.actionContainer}>
            <CustomButton
              title={
                isGuest
                  ? selectedRole === 'rider'
                    ? `${t('auth.continueAsRider', 'Explore as Rider')}`
                    : `${t('auth.continueAsDriver', 'Explore as Driver')}`
                  : selectedRole === 'rider'
                    ? `${t('common.continue', 'Continue')} (${t('auth.riderRoleTitle', 'Rider')})`
                    : `${t('common.continue', 'Continue')} (${t('auth.driverRoleTitle', 'Driver')})`
              }
              onPress={() => handleProceed()}
              variant="primary"
              icon="arrow-right"
              iconPosition="right"
            />
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/* =========================================
   BUILDING
========================================= */

const Building = ({ height, width }) => {
  return (
    <View
      style={[
        styles.building,
        {
          height,
          width,
        },
      ]}
    />
  );
};

/* =========================================
   STYLES
========================================= */

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8F8',
  },

  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#F7F8F8',
  },

  /* ========================================
     HERO
  ======================================== */

  hero: {
    height: 300,

    backgroundColor: GREEN,

    alignItems: 'center',
    justifyContent: 'center',

    position: 'relative',

    overflow: 'hidden',

    paddingTop: 15,
  },

  /* ========================================
     LOGO
  ======================================== */

  logoBox: {
    width: 82,
    height: 82,

    borderRadius: 23,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',
    justifyContent: 'center',

    zIndex: 5,

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.08,

    shadowRadius: 10,

    elevation: 5,
  },

  steeringWheel: {
    width: 48,
    height: 48,

    alignItems: 'center',
    justifyContent: 'center',
  },

  wheelOuter: {
    position: 'absolute',

    width: 45,
    height: 45,

    borderWidth: 4,

    borderColor: GREEN,

    borderRadius: 50,
  },

  wheelCenter: {
    position: 'absolute',

    width: 17,
    height: 11,

    borderWidth: 2.5,

    borderColor: GREEN,

    borderRadius: 10,

    top: 15,
  },

  leftSpoke: {
    position: 'absolute',

    width: 19,
    height: 3,

    backgroundColor: GREEN,

    borderRadius: 5,

    left: 4,
    top: 28,

    transform: [
      {
        rotate: '25deg',
      },
    ],
  },

  rightSpoke: {
    position: 'absolute',

    width: 19,
    height: 3,

    backgroundColor: GREEN,

    borderRadius: 5,

    right: 4,
    top: 28,

    transform: [
      {
        rotate: '-25deg',
      },
    ],
  },

  bottomSpoke: {
    position: 'absolute',

    width: 22,
    height: 3,

    backgroundColor: GREEN,

    borderRadius: 5,

    bottom: 4,
  },

  /* ========================================
     BRAND
  ======================================== */

  brandName: {
    color: '#FFFFFF',
    fontSize: responsiveFont(36),
    fontWeight: '500',
    marginTop: 12,
    letterSpacing: 0.2,
    zIndex: 5,
  },

  heroText: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: responsiveFont(14),
    fontWeight: '500',
    marginTop: 4,
    zIndex: 5,
  },

  /* ========================================
     CITY
  ======================================== */

  skyline: {
    position: 'absolute',
    bottom: 0,
    left: -10,
    right: -10,
    height: 100,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    opacity: 0.16,
  },

  building: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },

  /* ========================================
     CONTENT
  ======================================== */

  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 35,
  },

  guestModePill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2F1',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },

  guestModePillText: {
    fontSize: responsiveFont(12),
    fontWeight: '700',
    color: GREEN,
  },

  title: {
    fontSize: responsiveFont(23),
    lineHeight: Math.round(responsiveFont(23) * 1.3),
    fontWeight: '800',
    color: '#151515',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: responsiveFont(13),

    lineHeight: 20,

    color: '#888888',

    textAlign: 'center',

    marginTop: 6,

    marginBottom: 24,
  },

  rolesContainer: {
    width: '100%',
  },

  rolesRow: {
    flexDirection: 'row',
    gap: 14,
  },

  roleCardWide: {
    flex: 1,
    marginBottom: 0,
  },

  roleCard: {
    minHeight: 108,

    backgroundColor: '#FFFFFF',

    borderRadius: 16,

    borderWidth: 1.5,

    borderColor: '#E7E7E7',

    padding: 17,

    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 13,

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.04,

    shadowRadius: 7,

    elevation: 2,
  },

  selectedCard: {
    borderColor: GREEN,

    backgroundColor: '#F0FFFA',

    borderWidth: 2,
  },

  /* ========================================
     ROLE ICON
  ======================================== */

  roleIconContainer: {
    width: 58,
    height: 58,

    borderRadius: 16,

    backgroundColor: '#F3F5F5',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 14,
  },

  selectedCardIcon: {
    backgroundColor: '#DFFFF4',
  },

  /* ========================================
     ROLE CONTENT
  ======================================== */

  roleContent: {
    flex: 1,

    paddingRight: 5,
  },

  roleTitleRow: {
    flexDirection: 'row',

    alignItems: 'center',
  },

  roleTitle: {
    fontSize: responsiveFont(18),
    fontWeight: '700',
    color: '#171717',
  },

  roleDescription: {
    fontSize: responsiveFont(12.5),
    lineHeight: Math.round(responsiveFont(12.5) * 1.45),
    color: '#858585',
    marginTop: 5,
  },

  /* ========================================
     SELECTED BADGE
  ======================================== */

  selectedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  /* ========================================
     RADIO
  ======================================== */

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D5D5D5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
  },

  radioSelected: {
    borderColor: GREEN,
  },

  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: GREEN,
  },

  /* ========================================
     ACTION
  ======================================== */

  actionContainer: {
    marginTop: 10,
  },

  /* ========================================
     PREVIEW
  ======================================== */

  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    paddingVertical: 8,
  },

  previewText: {
    fontSize: responsiveFont(14),
    fontWeight: '700',
    color: '#444444',
  },

  previewArrow: {
    fontSize: responsiveFont(18),
    color: GREEN,
    marginLeft: 7,
    fontWeight: '700',
  },

  previewSubtext: {
    fontSize: responsiveFont(11),
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: 1,
  },
});

export default RoleSelectionScreen;