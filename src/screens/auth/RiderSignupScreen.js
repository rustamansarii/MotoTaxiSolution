import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import Icon from '../../components/Icon';
import { useResponsive, responsiveFont } from '../../utils/responsive';
import { useTranslation } from 'react-i18next';
import { LanguageButton } from '../../components/LanguageButton';
import { CountryPickerModal } from '../../components/CountryPickerModal';
import { usePopup } from '../../context/PopupContext';
import { useKeyboardSafe } from '../../components/keyboard';
import { registerUser, clearError, fetchCountryCodes } from '../../redux/features/auth/authSlice';
import { setGuestMode } from '../../utils/storage';

const GREEN = '#17baa1';

export const RiderSignupScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { isCompact, isLandscape, isFoldableOrTablet, insets } = useResponsive();
  const keyboard = useKeyboardSafe?.();
  const { showLoading, hideLoading, showError, showSuccess } = usePopup();

  const dispatch = useDispatch();
  const {
    loading: reduxLoading,
    error: reduxError,
    countryCodes,
  } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(fetchCountryCodes());
  }, [dispatch]);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
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

  // Auto-scroll focused input into view above the custom keyboard
  useEffect(() => {
    if (keyboard?.keyboardVisible) {
      let scrollY = 120;
      if (keyboard?.activeInputId === 'signup-phone') scrollY = 160;
      else if (keyboard?.activeInputId === 'signup-email') scrollY = 220;
      else if (keyboard?.activeInputId === 'signup-password') scrollY = 280;

      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: scrollY, animated: true });
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [keyboard?.keyboardVisible, keyboard?.activeInputId]);

  const validateForm = () => {
    if (!fullName.trim()) {
      return t('auth.fullNameRequired', 'Please enter your full name');
    }
    if (!phone.trim()) {
      return t('auth.phonePlaceholder', 'Please enter your mobile number');
    }
    if (phone.trim().length < 6) {
      return t('auth.phoneInvalid', 'Please enter a valid mobile number');
    }
    if (!email.trim()) {
      return t('auth.emailRequired', 'Please enter your email address');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return t('auth.emailInvalid', 'Please enter a valid email address');
    }
    if (!password.trim()) {
      return t('auth.passwordPlaceholder', 'Please enter your password');
    }
    if (password.trim().length < 6) {
      return t('auth.passwordLength', 'Password must be at least 6 characters');
    }
    return null;
  };

  const handleRegister = async () => {
    keyboard?.hideKeyboard?.();
    Keyboard.dismiss();
    setValidationError('');
    dispatch(clearError());

    const error = validateForm();
    if (error) {
      setValidationError(error);
      showError(error, t('common.error', 'Validation Error'));
      return;
    }

    const formattedPhone = phone.trim().startsWith('+')
      ? phone.trim()
      : `${selectedCountry.dial_code}${phone.trim()}`;

    const payload = {
      full_name: fullName.trim(),
      phone_number: formattedPhone,
      email: email.trim().toLowerCase(),
      password: password.trim(),
      role: 'RIDER',
    };

    showLoading(t('auth.creatingAccount', 'Creating your account...'), 'Connecting to Moto Taxi server');

    try {
      const actionResult = await dispatch(registerUser(payload));
      hideLoading();

      if (registerUser.fulfilled.match(actionResult)) {
        showSuccess(
          t('auth.signupSuccessMessage', 'Account created successfully! Welcome to Moto Taxi.'),
          t('auth.registrationComplete', 'Welcome to Moto Taxi!'),
          () => {
            navigation.replace('RiderNav');
          }
        );
      } else {
        const errorMsg = actionResult.payload || 'Registration failed. Please try again.';
        showError(errorMsg, t('auth.signupFailed', 'Registration Failed'));
      }
    } catch (err) {
      hideLoading();
      showError(err.message || 'An unexpected error occurred', 'Error');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN} />

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* =========================================
            HEADER HERO
        ========================================= */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => keyboard?.hideKeyboard?.()}
          style={[styles.hero, { height: isLandscape ? 160 : isCompact ? 200 : 230 }]}
        >
          {/* Back Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              keyboard?.hideKeyboard?.();
              navigation.goBack();
            }}
            style={[
              styles.backButton,
              { top: Math.max(insets.top, 16) },
            ]}
          >
            <Icon name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Language Selector in Header */}
          <View style={[styles.langContainer, { top: Math.max(insets.top, 16) }]}>
            <LanguageButton variant="dark" />
          </View>

          {/* Logo Box */}
          <View style={styles.logoBox}>
            <Icon name="bike" size={32} color={GREEN} />
          </View>

          <Text style={styles.brandTitle}>Moto Taxi</Text>
          <Text style={styles.brandSubtitle}>
            {t('auth.riderSignupHeader', 'Rider Sign Up')}
          </Text>
        </TouchableOpacity>

        {/* =========================================
            FORM CARD
        ========================================= */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.formTitle}>
              {t('auth.createRiderAccount', 'Create Rider Account')}
            </Text>
            <Text style={styles.formSubtitle}>
              {t('auth.riderSignupSubtitle', 'Enter your details to start booking bike rides')}
            </Text>
          </View>

          <View style={styles.form}>
            {/* FULL NAME */}
            <CustomInput
              id="signup-fullname"
              label={t('auth.fullName', 'Full Name')}
              value={fullName}
              onChangeText={text => {
                setFullName(text);
                if (validationError) setValidationError('');
                if (reduxError) dispatch(clearError());
              }}
              placeholder={t('auth.fullNamePlaceholder', 'e.g. Rahul Sharma')}
              leftIcon="user"
              containerStyle={styles.inputFieldContainer}
            />

            {/* PHONE NUMBER WITH COUNTRY PICKER */}
            <Text style={styles.inputLabel}>{t('auth.mobileNumber', 'Mobile Number')}</Text>
            <View style={styles.phoneSection}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowCountryPicker(true)}
                style={styles.countryBox}
              >
                <Text style={styles.flag}>{selectedCountry.flag}</Text>
                <Text style={styles.countryCode}>{selectedCountry.dial_code}</Text>
                <Text style={styles.arrow}>▾</Text>
              </TouchableOpacity>

              <View style={styles.phoneInput}>
                <CustomInput
                  id="signup-phone"
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

            {/* EMAIL */}
            <CustomInput
              id="signup-email"
              label={t('auth.emailAddress', 'Email Address')}
              value={email}
              onChangeText={text => {
                setEmail(text);
                if (validationError) setValidationError('');
                if (reduxError) dispatch(clearError());
              }}
              placeholder={t('auth.emailPlaceholder', 'e.g. rahul@example.com')}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="message"
              containerStyle={styles.inputFieldContainer}
            />

            {/* PASSWORD */}
            <CustomInput
              id="signup-password"
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
              containerStyle={styles.inputFieldContainer}
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

            {/* Terms Disclaimer */}
            <Text style={styles.terms}>
              By signing up, you agree to Moto Taxi's{' '}
              <Text style={styles.termsLink}>Terms & Conditions</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>.
            </Text>

            {/* SIGN UP BUTTON */}
            <CustomButton
              title={t('auth.createAccount', 'Create Account')}
              onPress={handleRegister}
              loading={reduxLoading || loading}
              variant="primary"
              icon="arrow-right"
              iconPosition="right"
              style={styles.continueButton}
            />

            {/* Sign In Link */}
            <View style={styles.signinRow}>
              <Text style={styles.alreadyHaveText}>
                {t('auth.alreadyHaveAccount', 'Already have an account?')}{' '}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  keyboard?.hideKeyboard?.();
                  navigation.navigate('Login', { role: 'rider' });
                }}
              >
                <Text style={styles.signinLinkText}>
                  {t('auth.signIn', 'Sign in')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Guest Option */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={async () => {
                keyboard?.hideKeyboard?.();
                try {
                  await setGuestMode(true);
                } catch (e) {}
                navigation.navigate('RoleSelection', { isGuest: true });
              }}
              style={styles.guestRow}
            >
              <Icon name="user" size={14} color={GREEN} style={{ marginRight: 6 }} />
              <Text style={styles.guestLinkText}>
                {t('auth.continueAsGuest', 'Continue as Guest')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Country Picker Modal */}
      <CountryPickerModal
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
        countries={countryCodes}
        selectedCountry={selectedCountry}
        onSelectCountry={country => {
          setSelectedCountry(country);
          setShowCountryPicker(false);
        }}
      />
    </SafeAreaView>
  );
};

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
  hero: {
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingTop: 10,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langContainer: {
    position: 'absolute',
    right: 16,
    zIndex: 20,
  },
  logoBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  brandTitle: {
    fontSize: responsiveFont(22),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: responsiveFont(13),
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -16,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeader: {
    marginBottom: 18,
  },
  formTitle: {
    fontSize: responsiveFont(22),
    fontWeight: '800',
    color: '#151515',
  },
  formSubtitle: {
    fontSize: responsiveFont(13),
    color: '#8A8F98',
    marginTop: 4,
  },
  form: {
    width: '100%',
  },
  inputFieldContainer: {
    marginBottom: 14,
  },
  inputLabel: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  phoneSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 14,
  },
  countryBox: {
    height: 54,
    minWidth: 92,
    borderWidth: 1.5,
    borderColor: '#E8E9EC',
    borderRadius: RADIUS.medium,
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  flag: {
    fontSize: responsiveFont(18),
    marginRight: 4,
  },
  countryCode: {
    fontSize: responsiveFont(14),
    fontWeight: '600',
    color: '#333333',
  },
  arrow: {
    fontSize: responsiveFont(12),
    color: '#555',
    marginLeft: 4,
  },
  phoneInput: {
    flex: 1,
  },
  inputNoMargin: {
    marginBottom: 0,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: responsiveFont(12),
    flex: 1,
    fontWeight: '500',
  },
  terms: {
    fontSize: responsiveFont(11),
    lineHeight: 16,
    textAlign: 'center',
    color: '#8A8F98',
    marginBottom: 18,
  },
  termsLink: {
    color: GREEN,
    fontWeight: '600',
  },
  continueButton: {
    marginBottom: 16,
  },
  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  alreadyHaveText: {
    fontSize: responsiveFont(13),
    color: '#666666',
  },
  signinLinkText: {
    fontSize: responsiveFont(13),
    fontWeight: '700',
    color: GREEN,
  },
  guestRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 6,
  },
  guestLinkText: {
    fontSize: responsiveFont(13),
    fontWeight: '700',
    color: GREEN,
  },
});

export default RiderSignupScreen;
