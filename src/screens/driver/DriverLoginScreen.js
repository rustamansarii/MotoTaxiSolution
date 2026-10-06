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
import Icon from '../../components/Icon';
import { useTranslation } from 'react-i18next';
import { useResponsive, responsiveFont } from '../../utils/responsive';
import { setGuestMode } from '../../utils/storage';

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
        showLanguage={true}
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

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={async () => {
              try {
                await setGuestMode(true);
              } catch (e) {}
              navigation.reset({
                index: 0,
                routes: [{ name: 'DriverNavigator' }],
              });
            }}
            style={styles.guestButton}
          >
            <Icon name="user" size={17} color={COLORS.primary} />
            <Text style={styles.guestButtonText}>
              {t('auth.continueAsGuest', 'Continue as Guest')}
            </Text>
          </TouchableOpacity>
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
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: RADIUS.large,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginTop: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  guestButtonText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: responsiveFont(14),
  },
});

export default DriverLoginScreen;
