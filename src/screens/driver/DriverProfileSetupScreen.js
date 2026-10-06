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
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import ProfileAvatar from '../../components/ProfileAvatar';
import Icon from '../../components/Icon';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '../../utils/responsive';

export const DriverProfileSetupScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { isFoldableOrTablet, insets } = useResponsive();
  const [fullName, setFullName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [ssnMasked, setSsnMasked] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [consentChecked, setConsentChecked] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleProceed = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('DriverLicenseCheck', { licenseNumber });
    }, 400);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Header
        title={t('driver.driverProfile')}
        onBack={() => navigation.goBack()}
        showLanguage={true}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, SPACING.xxxl) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.innerWrapper, { maxWidth: isFoldableOrTablet ? 540 : '100%' }]}>
          <View style={styles.avatarSection}>
          <ProfileAvatar name={fullName} size={84} showEdit={true} />
          <Text style={styles.avatarHint}>Professional driver photo</Text>
        </View>

        <View style={styles.form}>
          <CustomInput
            label={t('auth.fullName')}
            value={fullName}
            onChangeText={setFullName}
            placeholder="As on driver license"
            leftIcon="user"
          />

          <CustomInput
            label="Driver License Number"
            value={licenseNumber}
            onChangeText={setLicenseNumber}
            placeholder="e.g. DL-90823411-NY"
            autoCapitalize="characters"
            leftIcon="document"
          />

          <CustomInput
            label="Social Security Number (SSN)"
            value={ssnMasked}
            onChangeText={setSsnMasked}
            placeholder="•••-••-••••"
            leftIcon="shield"
            helperText="Required for criminal background verification check"
          />

          <CustomInput
            label="Commercial / Driving Experience"
            value={yearsExperience}
            onChangeText={setYearsExperience}
            placeholder="e.g. 3 years"
            leftIcon="clock"
          />

          {/* Consent Checkbox */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setConsentChecked(!consentChecked)}
            style={styles.consentRow}
          >
            <View
              style={[
                styles.checkbox,
                consentChecked && styles.checkboxChecked,
              ]}
            >
              {consentChecked && <Icon name="check" size={14} color={COLORS.white} />}
            </View>
            <Text style={styles.consentText}>
              I authorize Moto Taxi to run a background check and DMV driving record
              verification.
            </Text>
          </TouchableOpacity>

          <CustomButton
            title={`${t('common.next')}: ${t('driver.licenseVerification', 'License Verification')}`}
            onPress={handleProceed}
            loading={loading}
            disabled={!consentChecked}
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
    paddingBottom: SPACING.xxxl,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  avatarHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
  },
  form: {
    marginTop: SPACING.md,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: SPACING.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.small,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  consentText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    flex: 1,
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: SPACING.lg,
  },
});

export default DriverProfileSetupScreen;
