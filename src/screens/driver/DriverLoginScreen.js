import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '../../utils/responsive';

export const DriverLoginScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { isFoldableOrTablet, insets } = useResponsive();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [driverId, setDriverId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('DriverOTP', { phoneNumber });
    }, 600);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Header
        title={t('driver.driverLoginTitle')}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, SPACING.xxxl) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.innerWrapper, { maxWidth: isFoldableOrTablet ? 500 : '100%' }]}>
          <View style={styles.headerInfo}>
          <Text style={styles.title}>{t('driver.welcomeDriver')}</Text>
          <Text style={styles.subtitle}>
            {t('driver.driverLoginSubtitle')}
          </Text>
        </View>

        <View style={styles.form}>
          <CustomInput
            label={t('auth.phoneNumber')}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="e.g. 555-234-5678"
            keyboardType="phone-pad"
            leftIcon="phone"
          />

          <CustomInput
            label="Driver Partner ID"
            value={driverId}
            onChangeText={setDriverId}
            placeholder="e.g. DRV-8942"
            autoCapitalize="characters"
            leftIcon="user"
          />

          <Text style={styles.disclaimerText}>
            By signing in, you confirm your vehicle inspection and commercial liability
            insurance remain current and in good standing.
          </Text>

          <CustomButton
            title={t('common.continue')}
            onPress={handleNext}
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
    paddingBottom: SPACING.xxxl,
  },
  headerInfo: {
    marginBottom: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.h2,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  form: {
    marginTop: SPACING.xs,
  },
  disclaimerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    lineHeight: 18,
    marginVertical: SPACING.md,
  },
  submitBtn: {
    marginTop: SPACING.sm,
  },
});

export default DriverLoginScreen;
