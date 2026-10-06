import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import Icon from '../../components/Icon';
import { useTranslation } from 'react-i18next';
import { useResponsive, responsiveFont } from '../../utils/responsive';
import { usePopup } from '../../context/PopupContext';
import { useKeyboardSafe } from '../../components/keyboard';
import { API_URL } from '../../utils/apiUrl';
import ApiConstant from '../../utils/apiConstant';
import { getAccessToken } from '../../utils/storage';

const GREEN = '#17baa1';

export const DriverLicenseCheckScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { isFoldableOrTablet, insets } = useResponsive();
  const keyboard = useKeyboardSafe?.();
  const { showLoading, hideLoading, showError, showSuccess } = usePopup();

  const [licenseNumber, setLicenseNumber] = useState(
    route?.params?.licenseNumber || ''
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (keyboard?.keyboardVisible) {
      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 120, animated: true });
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [keyboard?.keyboardVisible]);

  const handleVerifyLicense = async () => {
    keyboard?.hideKeyboard?.();
    Keyboard.dismiss();
    setErrorMessage('');

    const trimmed = licenseNumber.trim();
    if (!trimmed) {
      const msg = t('driver.licenseRequired', 'Please enter your driving license number');
      setErrorMessage(msg);
      showError(msg, t('common.error', 'Validation Error'));
      return;
    }

    if (trimmed.length < 5) {
      const msg = t('driver.licenseInvalid', 'Please enter a valid license number');
      setErrorMessage(msg);
      showError(msg, t('common.error', 'Validation Error'));
      return;
    }

    setLoading(true);
    showLoading(
      t('driver.verifyingLicense', 'Verifying Driving License...'),
      t('driver.connectingRegistry', 'Checking license records with transport registry')
    );

    try {
      const token = await getAccessToken();
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}${ApiConstant.DriverProfile}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          license_number: trimmed,
        }),
      });

      const data = await response.json().catch(() => ({}));
      hideLoading();
      setLoading(false);

      if (response.ok) {
        setIsVerified(true);
        showSuccess(
          t(
            'driver.licenseSuccessMessage',
            'Driving license verified successfully! Please proceed to upload your license document to complete verification.'
          ),
          t('driver.licenseVerified', 'License Verified!'),
          () => {
            navigation.navigate('DocumentUpload', {
              licenseNumber: trimmed,
              driverProfile: data,
              phone: route?.params?.phone,
              email: route?.params?.email,
            });
          }
        );
      } else {
        let err =
          data.message ||
          data.detail ||
          data.error ||
          (data.license_number && Array.isArray(data.license_number)
            ? data.license_number[0]
            : data.license_number) ||
          'License verification failed. Please check the number and try again.';
        setErrorMessage(err);
        showError(err, t('driver.licenseFailed', 'Verification Failed'));
      }
    } catch (err) {
      hideLoading();
      setLoading(false);
      const networkErr =
        err.message || 'Unable to connect to verification server. Please check connection.';
      setErrorMessage(networkErr);
      showError(networkErr, 'Connection Error');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Header
        title={t('driver.licenseVerification', 'License Verification')}
        onBack={() => navigation.goBack()}
        showLanguage={true}
      />

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, SPACING.xxxl) + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.innerWrapper, { maxWidth: isFoldableOrTablet ? 540 : '100%' }]}>
          {/* Header Banner */}
          <View style={styles.heroCard}>
            <View style={styles.badgeCircle}>
              <Icon name="shield" size={32} color={GREEN} />
            </View>
            <Text style={styles.heroTitle}>
              {t('driver.drivingLicenseCheck', 'Driving License Verification')}
            </Text>
            <Text style={styles.heroSubtitle}>
              {t(
                'driver.drivingLicenseCheckDesc',
                'Verify your driving license to qualify as an active Moto Taxi rider partner'
              )}
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            <CustomInput
              id="driver-license-number"
              label={t('driver.licenseNumberLabel', 'Driving License Number')}
              value={licenseNumber}
              onChangeText={text => {
                setLicenseNumber(text.toUpperCase());
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="e.g. DL08 20220098764"
              autoCapitalize="characters"
              leftIcon="document"
              containerStyle={styles.inputSpacing}
            />

            {/* Error Container */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={16} color="#D32F2F" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Icon name="bike" size={22} color={GREEN} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>
                  {t('driver.licenseRequirements', 'License Guidelines')}
                </Text>
                <Text style={styles.infoDesc}>
                  • License must be valid and unexpired{'\n'}
                  • Authorizes two-wheeler / motorcycle driving{'\n'}
                  • After validation, you will upload a clear photo of the document
                </Text>
              </View>
            </View>

            {/* Verify Button */}
            <CustomButton
              title={
                isVerified
                  ? t('driver.proceedToUpload', 'Proceed to Document Upload')
                  : t('driver.verifyLicenseBtn', 'Verify License Number')
              }
              onPress={
                isVerified
                  ? () =>
                      navigation.navigate('DocumentUpload', {
                        licenseNumber: licenseNumber.trim(),
                      })
                  : handleVerifyLicense
              }
              loading={loading}
              variant="primary"
              icon="arrow-right"
              iconPosition="right"
              style={styles.submitBtn}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  innerWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  content: {
    padding: SPACING.xl,
  },
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 1.5,
    borderColor: '#E8E9EC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  badgeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E6FAF7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  heroTitle: {
    ...TYPOGRAPHY.title,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  heroSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 20,
    paddingHorizontal: SPACING.sm,
  },
  form: {
    width: '100%',
  },
  inputSpacing: {
    marginBottom: 14,
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FFFA',
    borderWidth: 1.5,
    borderColor: '#B7F5E5',
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: '#0e7061',
    marginBottom: 4,
  },
  infoDesc: {
    ...TYPOGRAPHY.caption,
    color: '#135c51',
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: SPACING.sm,
  },
});

export default DriverLicenseCheckScreen;
