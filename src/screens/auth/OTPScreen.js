import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { KeyboardTextInput } from '../../components/keyboard/KeyboardTextInput';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import CustomButton from '../../components/CustomButton';
import Icon from '../../components/Icon';
import { useResponsive } from '../../utils/responsive';
import { useTranslation } from 'react-i18next';

export const OTPScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const role = route.params?.role || 'rider';
  const identifier = route.params?.identifier || '+1 555-234-5678';
  const isDriver = role === 'driver';
  const { isCompact, isFoldableOrTablet, insets } = useResponsive();

  const [code, setCode] = useState('');
  const [timer, setTimer] = useState(45);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('ProfileSetup', { role });
    }, 500);
  };

  const otpBoxSize = isCompact ? 48 : 58;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Header
        title={t('auth.otpTitle', 'Verification Code')}
        onBack={() => navigation.goBack()}
        showLanguage={true}
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

          <Text style={styles.title}>{t('auth.enterCodePrompt', 'Enter 4-digit code')}</Text>
          <Text style={styles.subtitle}>
            {t('auth.otpSubtitle', 'We sent a verification code to')}{' '}
            <Text style={styles.boldIdentifier}>{identifier}</Text>
          </Text>

        {/* OTP Input Boxes */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => inputRef.current?.focus()}
          style={styles.otpRow}
        >
          {[0, 1, 2, 3].map((index) => {
            const digit = code[index] || '';
            const isActive = code.length === index;
            return (
              <View
                key={index}
                style={[
                  styles.otpBox,
                  { width: otpBoxSize, height: otpBoxSize },
                  digit ? styles.otpBoxFilled : null,
                  isActive ? styles.otpBoxActive : null,
                ]}
              >
                <Text style={styles.otpText}>{digit}</Text>
              </View>
            );
          })}
        </TouchableOpacity>

        {/* Hidden or direct input */}
        <KeyboardTextInput
          ref={inputRef}
          id="auth-otp-input"
          value={code}
          onChangeText={(text) => {
            const num = text.replace(/[^0-9]/g, '');
            if (num.length <= 4) setCode(num);
          }}
          keyboardType="number-pad"
          maxLength={4}
          style={styles.hiddenInput}
          autoFocus={true}
        />

        {/* Resend Timer */}
        <View style={styles.resendRow}>
          {timer > 0 ? (
            <Text style={styles.timerText}>
              {t('auth.resendOtp', 'Resend code')} in <Text style={styles.timerCount}>{timer}s</Text>
            </Text>
          ) : (
            <TouchableOpacity
              onPress={() => setTimer(45)}
              style={styles.resendBtn}
            >
              <Text style={styles.resendBtnText}>{t('auth.resendOtp', 'Resend Code')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <CustomButton
          title={t('auth.verifyAndContinue', 'Verify & Continue')}
          onPress={handleVerify}
          loading={loading}
          disabled={code.length < 4}
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
    maxWidth: 280,
  },
  boldIdentifier: {
    fontWeight: '700',
    color: COLORS.text,
  },
  otpRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  otpBox: {
    width: 60,
    height: 64,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.inputBg,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  otpBoxActive: {
    borderColor: COLORS.primaryDark,
    backgroundColor: COLORS.primaryLight,
  },
  otpText: {
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
  resendRow: {
    marginVertical: SPACING.lg,
  },
  timerText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textLight,
  },
  timerCount: {
    fontWeight: '700',
    color: COLORS.secondPrimary,
  },
  resendBtn: {
    padding: SPACING.xs,
  },
  resendBtnText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.secondPrimary,
  },
  verifyBtn: {
    width: '100%',
    marginTop: SPACING.md,
  },
});

export default OTPScreen;
