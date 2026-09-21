import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';

import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { useResponsive } from '../../utils/responsive';

const GREEN = '#45DDB1';

export const LoginScreen = ({ navigation, route }) => {
  const { isCompact, isLandscape, isFoldableOrTablet, insets } = useResponsive();
  const role = route.params?.role || 'rider';
  const isDriver = role === 'driver';

  const [authMethod, setAuthMethod] = useState('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = () => {
    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      navigation.navigate('OTP', {
        role,
        identifier:
          authMethod === 'phone'
            ? `+1 ${phone}`
            : email,
      });
    }, 600);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={GREEN}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* =========================================
            GREEN HEADER
        ========================================= */}

        <View style={[styles.hero, { height: isLandscape ? 170 : isCompact ? 220 : 280 }]}>

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

          {/* City Skyline */}
          <View
            pointerEvents="none"
            style={styles.skyline}
          >
            <Building height={55} width={20} />
            <Building height={85} width={28} />
            <Building height={45} width={18} />
            <Building height={105} width={30} />
            <Building height={70} width={22} />
            <Building height={92} width={26} />
            <Building height={50} width={20} />
            <Building height={75} width={25} />
            <Building height={45} width={19} />
            <Building height={100} width={28} />
            <Building height={65} width={22} />
            <Building height={82} width={27} />
            <Building height={52} width={20} />
            <Building height={70} width={24} />
          </View>
        </View>

        {/* =========================================
            AUTH CARD
        ========================================= */}

        <View style={styles.card}>

          {/* Tabs */}
          <View style={styles.tabs}>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                // If you have a separate signup screen,
                // navigate here.
              }}
              style={styles.tab}
            >
              <Text style={styles.inactiveTabText}>
                Sign Up
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.tab}
            >
              <Text style={styles.activeTabText}>
                Sign In
              </Text>

              <View style={styles.activeIndicator} />
            </TouchableOpacity>

          </View>

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* Content */}
          <View style={styles.form}>

            <Text style={styles.formTitle}>
              {isDriver ? 'Driver Login' : 'Welcome Back'}
            </Text>

            <Text style={styles.formSubtitle}>
              Login with your phone number or email
            </Text>

            {/* =====================================
                AUTH METHOD
            ===================================== */}

            <View style={styles.methodContainer}>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setAuthMethod('email')}
                style={[
                  styles.methodButton,
                  authMethod === 'email' &&
                    styles.activeMethodButton,
                ]}
              >
                <Text
                  style={[
                    styles.methodText,
                    authMethod === 'email' &&
                      styles.activeMethodText,
                  ]}
                >
                  Email
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setAuthMethod('phone')}
                style={[
                  styles.methodButton,
                  authMethod === 'phone' &&
                    styles.activeMethodButton,
                ]}
              >
                <Text
                  style={[
                    styles.methodText,
                    authMethod === 'phone' &&
                      styles.activeMethodText,
                  ]}
                >
                  Mobile Number
                </Text>
              </TouchableOpacity>

            </View>

            {/* =====================================
                EMAIL
            ===================================== */}

            {authMethod === 'email' && (
              <CustomInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="message"
                containerStyle={styles.input}
              />
            )}

            {/* =====================================
                PHONE
            ===================================== */}

            {authMethod === 'phone' && (
              <View style={styles.phoneSection}>

                <View style={styles.countryBox}>
                  <Text style={styles.flag}>
                    🇺🇸
                  </Text>

                  <Text style={styles.countryCode}>
                    +1
                  </Text>

                  <Text style={styles.arrow}>
                    ▾
                  </Text>
                </View>

                <View style={styles.phoneInput}>
                  <CustomInput
                    label="Mobile Number"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Mobile Number"
                    keyboardType="phone-pad"
                    leftIcon="phone"
                    containerStyle={styles.inputNoMargin}
                  />
                </View>

              </View>
            )}

            {/* =====================================
                TERMS
            ===================================== */}

            <Text style={styles.terms}>
              By clicking continue, you agree to our{' '}
              <Text style={styles.termsLink}>
                Terms & Conditions
              </Text>
              .
            </Text>

            {/* =====================================
                MAIN BUTTON
            ===================================== */}

            <CustomButton
              title="Continue"
              onPress={handleSendCode}
              loading={loading}
              icon="arrow-right"
              iconPosition="right"
              style={styles.continueButton}
            />

            {/* =====================================
                DIVIDER
            ===================================== */}

            <View style={styles.dividerContainer}>

              <View style={styles.divider} />

              <Text style={styles.orText}>
                OR
              </Text>

              <View style={styles.divider} />

            </View>

            {/* =====================================
                FACEBOOK
            ===================================== */}

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.facebookButton}
              onPress={handleSendCode}
            >
              <Text style={styles.facebookIcon}>
                f
              </Text>

              <Text style={styles.facebookText}>
                Continue with Facebook
              </Text>
            </TouchableOpacity>

            {/* Google / Apple */}
            <View style={styles.socialRow}>

              <TouchableOpacity
                style={styles.smallSocialButton}
                onPress={handleSendCode}
              >
                <Text style={styles.appleIcon}>
                  
                </Text>

                <Text style={styles.socialText}>
                  Apple
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.smallSocialButton}
                onPress={handleSendCode}
              >
                <Text style={styles.googleIcon}>
                  G
                </Text>

                <Text style={styles.socialText}>
                  Google
                </Text>
              </TouchableOpacity>

            </View>

          </View>
        </View>

        {/* Bottom safe space */}
        <View style={styles.bottomSpace} />

      </ScrollView>
    </SafeAreaView>
  );
};

/* =========================================
   BUILDING COMPONENT
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
    minHeight: 160,
    maxHeight: 390,

    backgroundColor: GREEN,

    alignItems: 'center',
    justifyContent: 'center',

    position: 'relative',

    overflow: 'hidden',
  },

  /* ========================================
     LOGO
  ======================================== */

  logoBox: {
    width: 115,
    height: 115,

    borderRadius: 30,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',
    justifyContent: 'center',

    zIndex: 5,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },

  steeringWheel: {
    width: 65,
    height: 65,

    alignItems: 'center',
    justifyContent: 'center',
  },

  wheelOuter: {
    position: 'absolute',

    width: 58,
    height: 58,

    borderWidth: 5,

    borderColor: GREEN,

    borderRadius: 50,
  },

  wheelCenter: {
    position: 'absolute',

    width: 22,
    height: 14,

    borderWidth: 3,

    borderColor: GREEN,

    borderRadius: 15,

    top: 20,
  },

  leftSpoke: {
    position: 'absolute',

    width: 24,
    height: 4,

    backgroundColor: GREEN,

    borderRadius: 5,

    left: 5,
    top: 36,

    transform: [
      {
        rotate: '25deg',
      },
    ],
  },

  rightSpoke: {
    position: 'absolute',

    width: 24,
    height: 4,

    backgroundColor: GREEN,

    borderRadius: 5,

    right: 5,
    top: 36,

    transform: [
      {
        rotate: '-25deg',
      },
    ],
  },

  bottomSpoke: {
    position: 'absolute',

    width: 28,
    height: 4,

    backgroundColor: GREEN,

    borderRadius: 5,

    bottom: 6,
  },

  /* ========================================
     SKYLINE
  ======================================== */

  skyline: {
    position: 'absolute',

    bottom: 0,

    left: -10,
    right: -10,

    height: 145,

    flexDirection: 'row',

    alignItems: 'flex-end',

    justifyContent: 'space-around',

    opacity: 0.20,
  },

  building: {
    backgroundColor: '#FFFFFF',

    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },

  /* ========================================
     CARD
  ======================================== */

  card: {
    backgroundColor: '#FFFFFF',

    marginHorizontal: 18,

    marginTop: -35,

    borderRadius: 8,

    maxWidth: 500,

    width: '92%',

    alignSelf: 'center',

    zIndex: 10,

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.12,

    shadowRadius: 12,

    elevation: 7,
  },

  /* ========================================
     TABS
  ======================================== */

  tabs: {
    height: 72,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-around',
  },

  tab: {
    flex: 1,

    height: '100%',

    alignItems: 'center',
    justifyContent: 'center',

    position: 'relative',
  },

  activeTabText: {
    fontSize: 22,

    fontWeight: '700',

    color: '#111111',
  },

  inactiveTabText: {
    fontSize: 22,

    fontWeight: '400',

    color: '#B7B7B7',
  },

  activeIndicator: {
    position: 'absolute',

    bottom: 0,

    width: 40,

    height: 4,

    borderRadius: 5,

    backgroundColor: GREEN,
  },

  cardDivider: {
    height: 1,

    backgroundColor: '#F0F0F0',
  },

  /* ========================================
     FORM
  ======================================== */

  form: {
    paddingHorizontal: 22,

    paddingTop: 24,

    paddingBottom: 25,
  },

  formTitle: {
    fontSize: 22,

    fontWeight: '700',

    color: '#111111',

    marginBottom: 5,
  },

  formSubtitle: {
    fontSize: 13,

    color: '#9B9B9B',

    marginBottom: 20,
  },

  /* ========================================
     METHOD
  ======================================== */

  methodContainer: {
    flexDirection: 'row',

    backgroundColor: '#F5F6F6',

    borderRadius: 10,

    padding: 3,

    marginBottom: 16,
  },

  methodButton: {
    flex: 1,

    height: 40,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 8,
  },

  activeMethodButton: {
    backgroundColor: '#FFFFFF',

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 1,
    },

    shadowOpacity: 0.08,

    shadowRadius: 3,

    elevation: 2,
  },

  methodText: {
    fontSize: 12,

    fontWeight: '600',

    color: '#A2A2A2',
  },

  activeMethodText: {
    color: '#222222',
  },

  /* ========================================
     INPUT
  ======================================== */

  input: {
    marginBottom: 10,
  },

  inputNoMargin: {
    marginBottom: 0,
  },

  phoneSection: {
    flexDirection: 'row',

    alignItems: 'flex-start',

    gap: 8,

    marginBottom: 10,
  },

  countryBox: {
    height: 54,

    minWidth: 92,

    marginTop: 22,

    borderWidth: 1,

    borderColor: '#E7E7E7',

    borderRadius: 8,

    backgroundColor: '#FAFAFA',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 10,
  },

  flag: {
    fontSize: 17,

    marginRight: 5,
  },

  countryCode: {
    fontSize: 14,

    fontWeight: '600',

    color: '#333333',
  },

  arrow: {
    fontSize: 12,

    color: '#555',

    marginLeft: 5,
  },

  phoneInput: {
    flex: 1,
  },

  /* ========================================
     TERMS
  ======================================== */

  terms: {
    fontSize: 11,

    lineHeight: 17,

    textAlign: 'center',

    color: '#999999',

    marginTop: 5,

    marginBottom: 15,
  },

  termsLink: {
    color: '#555555',

    fontWeight: '600',
  },

  /* ========================================
     CONTINUE BUTTON
  ======================================== */

  continueButton: {
    height: 50,

    borderRadius: 8,

    backgroundColor: GREEN,
  },

  /* ========================================
     DIVIDER
  ======================================== */

  dividerContainer: {
    flexDirection: 'row',

    alignItems: 'center',

    marginVertical: 18,
  },

  divider: {
    flex: 1,

    height: 1,

    backgroundColor: '#EEEEEE',
  },

  orText: {
    fontSize: 11,

    color: '#AAAAAA',

    marginHorizontal: 12,

    fontWeight: '600',
  },

  /* ========================================
     FACEBOOK
  ======================================== */

  facebookButton: {
    height: 48,

    borderRadius: 7,

    backgroundColor: '#287BE0',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',
  },

  facebookIcon: {
    color: '#FFFFFF',

    fontSize: 23,

    fontWeight: '700',

    marginRight: 9,
  },

  facebookText: {
    color: '#FFFFFF',

    fontSize: 14,

    fontWeight: '600',
  },

  /* ========================================
     OTHER SOCIAL
  ======================================== */

  socialRow: {
    flexDirection: 'row',

    gap: 10,

    marginTop: 10,
  },

  smallSocialButton: {
    flex: 1,

    height: 46,

    borderRadius: 7,

    borderWidth: 1,

    borderColor: '#E5E5E5',

    backgroundColor: '#FFFFFF',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',
  },

  appleIcon: {
    fontSize: 20,

    color: '#111111',

    marginRight: 7,
  },

  googleIcon: {
    fontSize: 18,

    fontWeight: '700',

    color: '#4285F4',

    marginRight: 7,
  },

  socialText: {
    fontSize: 13,

    color: '#333333',

    fontWeight: '600',
  },

  bottomSpace: {
    height: 25,
  },
});

export default LoginScreen;