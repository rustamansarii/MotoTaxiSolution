import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardTextInput } from '../../components/keyboard/KeyboardTextInput';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import CustomButton from '../../components/CustomButton';
import Icon from '../../components/Icon';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '../../utils/responsive';

export const DriverOTPScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const phoneNumber = route.params?.phoneNumber || '555-234-5678';
  const { isCompact, isFoldableOrTablet, insets } = useResponsive();
  const [code, setCode] = useState('');
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('DriverProfileSetup');
    }, 600);
  };

  const boxSize = isCompact ? 48 : 58;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Header
        title={t('auth.otpVerification')}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: Math.max(insets.bottom, SPACING.xl) },
        ]}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, { maxWidth: isFoldableOrTablet ? 480 : '100%' }]}>
          <View style={styles.iconCircle}>
            <Icon name="shield" size={32} color={COLORS.primary} />
          </View>

          <Text style={styles.title}>{t('auth.enterOtp')}</Text>
          <Text style={styles.subtitle}>
            {t('auth.otpSentTo')} <Text style={styles.phoneText}>+1 {phoneNumber}</Text>
          </Text>

        <View style={styles.otpRow}>
          {[0, 1, 2, 3].map((index) => {
            const digit = code[index] || '';
            return (
              <View
                key={index}
                style={[
                  styles.box,
                  { width: boxSize, height: boxSize },
                  digit ? styles.boxFilled : null,
                ]}
              >
                <Text style={styles.boxText}>{digit}</Text>
              </View>
            );
          })}
        </View>

        <KeyboardTextInput
          id="driver-otp-input"
          value={code}
          onChangeText={(t) => {
            if (t.length <= 4) setCode(t);
          }}
          keyboardType="number-pad"
          maxLength={4}
          style={styles.hiddenInput}
          autoFocus
        />

        <View style={styles.resendArea}>
          {timer > 0 ? (
            <Text style={styles.timerText}>
              Resend in <Text style={styles.timerCount}>{timer}s</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={() => setTimer(30)}>
              <Text style={styles.resendBtnText}>{t('auth.resendOtp')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <CustomButton
          title={t('auth.verify')}
          onPress={handleVerify}
          loading={loading}
          disabled={code.length < 4}
          variant="primary"
          style={styles.verifyBtn}
        />
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
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: '100%',
    alignSelf: 'center',
    padding: SPACING.xl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h2,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.xxl,
  },
  phoneText: {
    fontWeight: '700',
    color: COLORS.text,
  },
  otpRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  box: {
    width: 60,
    height: 64,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.inputBg,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  boxText: {
    ...TYPOGRAPHY.h2,
    fontWeight: '700',
    color: COLORS.text,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  resendArea: {
    marginBottom: SPACING.xl,
  },
  timerText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textLight,
  },
  timerCount: {
    fontWeight: '700',
    color: COLORS.secondPrimary,
  },
  resendBtnText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.secondPrimary,
  },
  verifyBtn: {
    width: '100%',
  },
});

export default DriverOTPScreen;
