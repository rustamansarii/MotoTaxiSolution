import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TouchableWithoutFeedback,
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [selectedCountry, setSelectedCountry] = useState({
    name: 'Cameroon',
    iso2: 'CM',
    dial_code: '+237',
    flag: '🇨🇲',
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
      else if (keyboard?.activeInputId === 'signup-confirmpassword') scrollY = 340;

      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: scrollY, animated: true });
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [keyboard?.keyboardVisible, keyboard?.activeInputId]);

  const handleRegister = async () => {
    keyboard?.hideKeyboard?.();
    Keyboard.dismiss();
    setValidationError('');
    setFieldErrors({
      full_name: '',
      phone_number: '',
      email: '',
      password: '',
      confirm_password: '',
    });
    dispatch(clearError());

    // Only validate password confirmation mismatch if both passwords are provided
    if (password.trim() && confirmPassword.trim() && password.trim() !== confirmPassword.trim()) {
      setFieldErrors(prev => ({
        ...prev,
        confirm_password: t('auth.passwordMismatch', 'Passwords do not match'),
      }));
      scrollViewRef.current?.scrollTo({ y: 360, animated: true });
      return;
    }

    // Format phone: if empty, send empty string so API returns blank validation error
    const formattedPhone = phone.trim()
      ? (phone.trim().startsWith('+') ? phone.trim() : `${selectedCountry?.dial_code || ''}${phone.trim()}`)
      : '';

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
            navigation.reset({
              index: 0,
              routes: [{ name: 'RiderNav' }],
            });
          }
        );
      } else {
        const payloadData = actionResult.payload;
        const apiErrors = {};
        let generalErrorMessage = '';

        if (payloadData && typeof payloadData === 'object') {
          const rawErrors = payloadData.errors || payloadData.fieldErrors || (payloadData.message ? null : payloadData);
          if (rawErrors && typeof rawErrors === 'object') {
            Object.entries(rawErrors).forEach(([key, val]) => {
              const msg = Array.isArray(val) ? val.join(' ') : String(val);
              if (key === 'non_field_errors' || key === 'detail') {
                generalErrorMessage = msg;
              } else if (['full_name', 'phone_number', 'email', 'password', 'confirm_password'].includes(key)) {
                apiErrors[key] = msg;
              } else {
                apiErrors[key] = msg;
              }
            });
          }
        }

        if (Object.keys(apiErrors).length === 0 && typeof payloadData === 'string') {
          const lines = payloadData.split('\n');
          lines.forEach(line => {
            const [field, ...rest] = line.split(':');
            if (rest.length > 0) {
              const msg = rest.join(':').trim();
              const trimmedField = field.trim();
              if (['full_name', 'phone_number', 'email', 'password'].includes(trimmedField)) {
                apiErrors[trimmedField] = msg;
              } else {
                generalErrorMessage = line;
              }
            } else {
              generalErrorMessage = line;
            }
          });
        }

        if (Object.keys(apiErrors).length > 0) {
          setFieldErrors(prev => ({
            full_name: '',
            phone_number: '',
            email: '',
            password: '',
            confirm_password: '',
            ...apiErrors,
          }));
          dispatch(clearError());

          if (generalErrorMessage) {
            setValidationError(generalErrorMessage);
          } else {
            setValidationError('');
          }

          if (apiErrors.full_name) {
            scrollViewRef.current?.scrollTo({ y: 80, animated: true });
          } else if (apiErrors.phone_number) {
            scrollViewRef.current?.scrollTo({ y: 150, animated: true });
          } else if (apiErrors.email) {
            scrollViewRef.current?.scrollTo({ y: 220, animated: true });
          } else if (apiErrors.password) {
            scrollViewRef.current?.scrollTo({ y: 290, animated: true });
          }
        } else {
          const errorMsg =
            generalErrorMessage ||
            (payloadData && typeof payloadData === 'object'
              ? payloadData.message || payloadData.detail
              : payloadData) ||
            'Registration failed. Please try again.';
          setValidationError(errorMsg);
          showError(errorMsg, t('auth.signupFailed', 'Registration Failed'));
        }
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
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={() => {
          keyboard?.hideKeyboard?.();
          Keyboard.dismiss();
        }}
        contentContainerStyle={styles.scrollContent}
      >
        {/* =========================================
            HEADER HERO
        ========================================= */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            keyboard?.hideKeyboard?.();
            Keyboard.dismiss();
          }}
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
              required
              onChangeText={text => {
                setFullName(text);
                if (fieldErrors.full_name) {
                  setFieldErrors(prev => ({ ...prev, full_name: '' }));
                }
                if (validationError) setValidationError('');
                if (reduxError) dispatch(clearError());
              }}
              placeholder={t('auth.fullNamePlaceholder', 'e.g. Rahul Sharma')}
              leftIcon="user"
              error={fieldErrors.full_name}
              containerStyle={styles.inputFieldContainer}
              
            />

            {/* PHONE NUMBER WITH COUNTRY PICKER */}
            <View style={styles.phoneFieldContainer}>
              <Text style={styles.inputLabel}>{t('auth.mobileNumber', 'Mobile Number')} <Text style={styles.requiredAsterisk}>*</Text> </Text>
              <View style={styles.phoneSection}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowCountryPicker(true)}
                  style={[
                    styles.countryBox,
                    fieldErrors.phone_number ? styles.countryBoxError : null,
                  ]}
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
                      if (fieldErrors.phone_number) {
                        setFieldErrors(prev => ({ ...prev, phone_number: '' }));
                      }
                      if (validationError) setValidationError('');
                      if (reduxError) dispatch(clearError());
                    }}
                    placeholder={t('auth.phonePlaceholder', 'Mobile Number')}
                    keyboardType="phone-pad"
                    leftIcon="phone"
                    error={fieldErrors.phone_number}
                    hideErrorText={true}
                    containerStyle={styles.inputNoMargin}
                  />
                </View>
              </View>
              {fieldErrors.phone_number ? (
                <Text style={styles.fieldErrorText}>{fieldErrors.phone_number}</Text>
              ) : null}
            </View>

            {/* EMAIL */}
            <CustomInput
              id="signup-email"
              label={t('auth.emailAddress', 'Email Address')}
              value={email}
              onChangeText={text => {
                setEmail(text);
                if (fieldErrors.email) {
                  setFieldErrors(prev => ({ ...prev, email: '' }));
                }
                if (validationError) setValidationError('');
                if (reduxError) dispatch(clearError());
              }}
              placeholder={t('auth.emailPlaceholder', 'e.g. rahul@example.com')}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="message"
              error={fieldErrors.email}
              containerStyle={styles.inputFieldContainer}
            />

            {/* PASSWORD */}
            <CustomInput
              id="signup-password"
              label={t('auth.password', 'Password')}
              required
              value={password}
              onChangeText={text => {
                setPassword(text);
                if (fieldErrors.password) {
                  setFieldErrors(prev => ({ ...prev, password: '' }));
                }
                if (confirmPassword && text !== confirmPassword) {
                  setFieldErrors(prev => ({
                    ...prev,
                    confirm_password: t('auth.passwordMismatch', 'Passwords do not match'),
                  }));
                } else if (confirmPassword && text === confirmPassword) {
                  setFieldErrors(prev => ({ ...prev, confirm_password: '' }));
                }
                if (validationError) setValidationError('');
                if (reduxError) dispatch(clearError());
              }}
              placeholder={t('auth.passwordPlaceholder', 'Enter your password')}
              secureTextEntry
              leftIcon="lock"
              error={fieldErrors.password}
              containerStyle={styles.inputFieldContainer}
            />

            {/* CONFIRM PASSWORD */}
            <CustomInput
              id="signup-confirmpassword"
              label={t('auth.confirmPassword', 'Confirm Password')}
              required
              value={confirmPassword}
              onChangeText={text => {
                setConfirmPassword(text);
                if (fieldErrors.confirm_password) {
                  setFieldErrors(prev => ({ ...prev, confirm_password: '' }));
                }
                if (password && text && text !== password) {
                  setFieldErrors(prev => ({
                    ...prev,
                    confirm_password: t('auth.passwordMismatch', 'Passwords do not match'),
                  }));
                }
                if (validationError) setValidationError('');
                if (reduxError) dispatch(clearError());
              }}
              placeholder={t('auth.confirmPasswordPlaceholder', 'Re-enter your password')}
              secureTextEntry
              leftIcon="lock"
              error={fieldErrors.confirm_password}
              containerStyle={styles.inputFieldContainer}
            />

            {/* Validation / Redux Error Banner */}
            {validationError || (reduxError && Object.values(fieldErrors).every(v => !v)) ? (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={16} color="#D32F2F" />
                <Text style={styles.errorText}>
                  {validationError || reduxError}
                </Text>
              </View>
            ) : null}

           

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
                } catch (e) { }
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
  phoneFieldContainer: {
    marginBottom: 14,
  },
  phoneSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
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
    requiredAsterisk: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.danger, // red *
    marginLeft: 2,
  },
  countryBoxError: {
    borderColor: COLORS.danger,
    backgroundColor: '#FFF5F5',
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
  fieldErrorText: {
    color: '#D32F2F',
    fontSize: responsiveFont(12),
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
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
