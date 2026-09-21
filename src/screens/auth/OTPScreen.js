import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import CustomButton from '../../components/CustomButton';
import Icon from '../../components/Icon';
import { useResponsive } from '../../utils/responsive';

export const OTPScreen = ({ navigation, route }) => {
  const role = route.params?.role || 'rider';
  const identifier = route.params?.identifier || '+1 555-234-5678';
  const isDriver = role === 'driver';
  const { isCompact, isFoldableOrTablet, insets } = useResponsive();

  const [code, setCode] = useState('4821');
  const [timer, setTimer] = useState(45);
  const [loading, setLoading] = useState(false);

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
        title="Verification Code"
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

          <Text style={styles.title}>Enter 4-digit code</Text>
          <Text style={styles.subtitle}>
            We sent a verification code to{' '}
            <Text style={styles.boldIdentifier}>{identifier}</Text>
          </Text>

        {/* OTP Input Boxes */}
        <View style={styles.otpRow}>
          {[0, 1, 2, 3].map((index) => {
            const digit = code[index] || '';
            return (
              <View
                key={index}
                style={[
                  styles.otpBox,
                  { width: otpBoxSize, height: otpBoxSize },
                  digit ? styles.otpBoxFilled : null,
                ]}
              >
                <Text style={styles.otpText}>{digit}</Text>
              </View>
            );
          })}
        </View>

        {/* Hidden or direct input */}
        <TextInput
          value={code}
          onChangeText={(text) => {
            if (text.length <= 4) setCode(text);
          }}
          keyboardType="number-pad"
          maxLength={4}
          style={styles.hiddenInput}
          autoFocus
        />

        {/* Resend Timer */}
        <View style={styles.resendRow}>
          {timer > 0 ? (
            <Text style={styles.timerText}>
              Resend code in <Text style={styles.timerCount}>{timer}s</Text>
            </Text>
          ) : (
            <TouchableOpacity
              onPress={() => setTimer(45)}
              style={styles.resendBtn}
            >
              <Text style={styles.resendBtnText}>Resend Code</Text>
            </TouchableOpacity>
          )}
        </View>

        <CustomButton
          title="Verify & Continue"
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
