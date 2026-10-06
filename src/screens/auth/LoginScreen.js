import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError, fetchCountryCodes } from '../../redux/features/auth/authSlice';
import Icon from '../../components/Icon';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { useResponsive } from '../../utils/responsive';
import { useTranslation } from 'react-i18next';
import { LanguageButton } from '../../components/LanguageButton';
import { KeyboardTextInput, useKeyboardSafe } from '../../components/keyboard';
import { CountryPickerModal } from '../../components/CountryPickerModal';
import { usePopup } from '../../context/PopupContext';
import { saveRole, saveTokens, setGuestMode } from '../../utils/storage';

const GREEN = '#17baa1';

export const LoginScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { isCompact, isLandscape, isFoldableOrTablet, insets } = useResponsive();
  const role = route.params?.role || 'rider';
  const isDriver = role === 'driver';

  const keyboard = useKeyboardSafe?.();
  const { showLoading, hideLoading, showError, showSuccess } = usePopup();

  const dispatch = useDispatch();
  const {
    loading: reduxLoading,
    error: reduxError,
    user,
    countryCodes,
    countryCodesLoading,
  } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(fetchCountryCodes());
  }, [dispatch]);

  const [authMethod, setAuthMethod] = useState(
    route.params?.email && !route.params?.phone ? 'email' : 'phone'
  );
  const [phone, setPhone] = useState(route.params?.phone || '');
  const [email, setEmail] = useState(route.params?.email || '');
  const [password, setPassword] = useState('');
  const [selectedCountry, setSelectedCountry] = useState({
    name: 'India',
    iso2: 'IN',
    dial_code: '+91',
    flag: '🇮🇳',
  });
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef(null);

  // Automatically scroll focused input into view when custom keyboard opens
  useEffect(() => {
    if (keyboard?.keyboardVisible) {
      const scrollY = keyboard?.activeInputId === 'login-password' ? 240 : 160;
      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: scrollY, animated: true });
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [keyboard?.keyboardVisible, keyboard?.activeInputId]);

  const handleLogin = async () => {
    keyboard?.hideKeyboard?.();
    Keyboard.dismiss();
    setValidationError('');
    dispatch(clearError());

    const isPhone = authMethod === 'phone';
    const trimmedInput = isPhone ? phone.trim() : email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedInput) {
      const msg = isPhone
        ? t('auth.phoneRequired', 'Please enter your mobile number')
        : t('auth.emailRequiredMsg', 'Please enter your email');
      setValidationError(msg);
      showError(msg, t('common.requiredField', 'Required Field'));
      return;
    }

    if (!trimmedPassword) {
      const msg = t('auth.passwordRequired', 'Please enter your password');
      setValidationError(msg);
      showError(msg, t('common.requiredField', 'Required Field'));
      return;
    }

    let payload;
    if (isPhone) {
      const formattedPhone = trimmedInput.startsWith('+')
        ? trimmedInput
        : `${selectedCountry.dial_code}${trimmedInput}`;
      payload = {
        phone_number: formattedPhone,
        password: trimmedPassword,
      };
    } else {
      payload = {
        email: trimmedInput,
        password: trimmedPassword,
      };
    }

    // Show custom loading popup
    showLoading(
      t('auth.signingIn', 'Signing in...'),
      t('auth.connectingServer', 'Connecting to Moto Taxi server')
    );

    try {
      const actionResult = await dispatch(loginUser(payload));
      hideLoading();

      if (loginUser.fulfilled.match(actionResult)) {
        const responseData = actionResult.payload || {};
        const accessToken = responseData.access || responseData.token;
        const returnedRole = (
          responseData.role ||
          responseData.user?.role ||
          route.params?.role ||
          ''
        ).toUpperCase();

        const isDriverUser = returnedRole === 'DRIVER';
        const targetNav = isDriverUser ? 'DriverNav' : 'RiderNav';

        // Explicitly guarantee role and access token persistence in AsyncStorage
        if (returnedRole) {
          await saveRole(returnedRole);
        }
        await setGuestMode(false);
        if (accessToken) {
          await saveTokens({
            access: accessToken,
            refresh: responseData.refresh || '',
            role: returnedRole,
          });
        }

        console.log(
          `[Login] Success! Access Token: ${accessToken ? 'Received' : 'None'} | Role: "${returnedRole}" | Navigating to: ${targetNav}`
        );

        showSuccess(
          t('auth.loginSuccessMessage', 'Logged in successfully! Redirecting...'),
          t('auth.welcomeBack', 'Welcome Back'),
          () => {
            navigation.replace(targetNav);
          }
        );

        // Auto-navigate after brief moment so user doesn't have to wait or press OK
        setTimeout(() => {
          navigation.replace(targetNav);
        }, 1200);
      } else {
        const errorMsg =
          actionResult.payload ||
          t('auth.loginFailedMsg', 'Login failed. Please check your credentials.');
        showError(errorMsg, t('auth.loginFailed', 'Login Failed'));
      }
    } catch (err) {
      hideLoading();
      showError(err.message || t('common.error', 'An unexpected error occurred'), t('common.error', 'Error'));
    }
  };

  const handleSendCode = () => {
    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      const formattedPhone = phone.trim().startsWith('+')
        ? phone.trim()
        : `${selectedCountry.dial_code} ${phone.trim()}`;

      navigation.navigate('OTP', {
        role,
        identifier:
          authMethod === 'phone'
            ? formattedPhone
            : email,
      });
    }, 600);
  };

  const handleGuestMode = async () => {
    keyboard?.hideKeyboard?.();
    Keyboard.dismiss();
    try {
      await setGuestMode(true);
    } catch (e) {}
    navigation.navigate('RoleSelection', { isGuest: true });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={GREEN}
      />

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >

        {/* =========================================
            GREEN HEADER
        ========================================= */}

        <View
          onStartShouldSetResponder={() => {
            keyboard?.hideKeyboard?.();
            return false;
          }}
          style={[styles.hero, { height: isLandscape ? 170 : isCompact ? 220 : 280 }]}
        >

          {/* Language Selector in Header */}
          <View style={{ position: 'absolute', top: 14, right: 14, zIndex: 20 }}>
            <LanguageButton variant="dark" />
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
              style={styles.tab}
            >
              <Text style={styles.activeTabText}>
                {t('auth.signIn', 'Sign in')}
              </Text>

              <View style={styles.activeIndicator} />
            </TouchableOpacity>

          </View>

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* Content */}
          <View style={styles.form}>

            <Text style={styles.formTitle}>
              {isDriver
                ? t('auth.driverLogin', 'Driver Login')
                : t('auth.welcomeBack', 'Welcome Back')}
            </Text>

            <Text style={styles.formSubtitle}>
              {t('auth.loginSubtitle', 'Login with your phone number or email')}
            </Text>

            {/* KYC Pending Banner */}
            {route.params?.kycPending && (
              <View style={styles.kycPendingBanner}>
                <View style={styles.kycBannerHeader}>
                  <View style={styles.kycClockBadge}>
                    <Icon name="clock" size={16} color="#D97706" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.kycBannerTitle}>
                      {t('auth.kycUnderReview', 'KYC Verification Under Review')}
                    </Text>
                    <Text style={styles.kycBannerStatus}>
                      {t('auth.statusPending', 'Status: PENDING')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.kycBannerText}>
                  {t(
                    'auth.kycPendingDesc',
                    'Your vehicle documents (RC, Insurance, PUC, Permit) have been submitted and are under review. Once approved by the administration, please log in below to access your driver dashboard and start accepting rides.'
                  )}
                </Text>
              </View>
            )}


            {/* =====================================
                PHONE
            ===================================== */}

         
              <View style={styles.phoneSection}>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowCountryPicker(true)}
                  style={styles.countryBox}
                >
                  <Text style={styles.flag}>
                    {selectedCountry.flag}
                  </Text>

                  <Text style={styles.countryCode}>
                    {selectedCountry.dial_code}
                  </Text>

                  <Text style={styles.arrow}>
                    ▾
                  </Text>
                </TouchableOpacity>

                <View style={styles.phoneInput}>
                  <CustomInput
                    id="login-phone"
                    label={t('auth.mobileNumber', 'Mobile Number')}
                    value={phone}
                    onChangeText={text => {
                      setPhone(text);
                      if (validationError) setValidationError('');
                      if (reduxError) dispatch(clearError());
                    }}
                    placeholder={t('auth.phonePlaceholder', 'Mobile Number')}
                    keyboardType="phone-pad"
                    leftIcon="phone"
                    containerStyle={styles.inputNoMargin}
                  />
                </View>

              </View>
            

            {/* =====================================
                PASSWORD
            ===================================== */}

            <CustomInput
              id="login-password"
              label={t('auth.password', 'Password')}
              value={password}
              onChangeText={text => {
                setPassword(text);
                if (validationError) setValidationError('');
                if (reduxError) dispatch(clearError());
              }}
              placeholder={t('auth.passwordPlaceholder', 'Enter your password')}
              secureTextEntry
              leftIcon="lock"
              containerStyle={styles.input}
            />

            {/* Validation / Redux Error Banner */}
            {validationError || reduxError ? (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={16} color="#D32F2F" />
                <Text style={styles.errorText}>
                  {validationError || reduxError}
                </Text>
              </View>
            ) : null}

            {/* =====================================
                TERMS
            ===================================== */}

            <Text style={styles.terms}>
              {t('auth.termsPrefix', 'By clicking continue, you agree to our')}{' '}
              <Text style={styles.termsLink}>
                {t('auth.termsAndConditions', 'Terms & Conditions')}
              </Text>
              .
            </Text>

            {/* =====================================
                MAIN BUTTON
            ===================================== */}

            <CustomButton
              title={t('common.continue', 'Continue')}
              onPress={handleLogin}
              loading={reduxLoading || loading}
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
                {t('common.or', 'OR').toUpperCase()}
              </Text>

              <View style={styles.divider} />

            </View>

            {/* =====================================
                GUEST MODE BUTTON
            ===================================== */}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleGuestMode}
              style={styles.guestButton}
            >
              <Icon name="user" size={18} color={GREEN} />
              <Text style={styles.guestButtonText}>
                {t('auth.continueAsGuest', 'Continue as Guest')}
              </Text>
            </TouchableOpacity>

         

            {/* Sign Up Link */}
            <View style={styles.signupPromptRow}>
              <Text style={styles.noAccountText}>
                {t('auth.noAccount', "Don't have an account?")}{' '}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                
                    navigation.navigate('RoleSelection');
                  
                }}
              >
                <Text style={styles.signupLinkText}>
                  {t('auth.signUp', 'Sign Up')}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>

        {/* Bottom safe space */}
        <View style={styles.bottomSpace} />

      </ScrollView>

      {console.log("countryCodes",countryCodes)}

      <CountryPickerModal
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
        countries={countryCodes}
        selectedCountry={selectedCountry}
        onSelectCountry={setSelectedCountry}
        loading={countryCodesLoading}
      />
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
    paddingBottom: 40,
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

  guestButton: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: GREEN,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 4,
  },

  guestButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: GREEN,
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

  signupPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },

  noAccountText: {
    fontSize: 13,
    color: '#888888',
  },

  signupLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: GREEN,
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDECEA',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F5C6CB',
  },

  errorText: {
    color: '#D32F2F',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },

  otpOptionContainer: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 6,
  },

  otpOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: GREEN,
  },

  kycPendingBanner: {
    backgroundColor: '#FFFBEB',
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    marginTop: 4,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  kycBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  kycClockBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  kycBannerTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: '#92400E',
  },
  kycBannerStatus: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: '#D97706',
    fontSize: 11,
    marginTop: 1,
  },
  kycBannerText: {
    ...TYPOGRAPHY.caption,
    color: '#78350F',
    lineHeight: 18,
    marginTop: 2,
  },
});

export default LoginScreen;