import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Icon from '../Icon';
import { formatCurrency } from '../../utils/formatters';

/**
 * High-fidelity pixel QR Code Pattern Generator Component
 * Creates an authentic QR code matrix with 3 standard position detection corners
 * and randomized deterministic module blocks.
 */
const QRCodeMatrix = ({ size = 200 }) => {
  const matrixSize = 21; // Standard Version 1 QR matrix 21x21
  const cellSize = Math.floor(size / matrixSize);

  // Position detection corner pattern (7x7)
  const isCorner = (r, c) => {
    // Top-left
    if (r < 7 && c < 7) return true;
    // Top-right
    if (r < 7 && c >= matrixSize - 7) return true;
    // Bottom-left
    if (r >= matrixSize - 7 && c < 7) return true;
    return false;
  };

  const isCornerDark = (r, c) => {
    // Top-left
    if (r < 7 && c < 7) {
      if (r === 0 || r === 6 || c === 0 || c === 6) return true;
      if (r >= 2 && r <= 4 && c >= 2 && c <= 4) return true;
      return false;
    }
    // Top-right
    if (r < 7 && c >= matrixSize - 7) {
      const cc = c - (matrixSize - 7);
      if (r === 0 || r === 6 || cc === 0 || cc === 6) return true;
      if (r >= 2 && r <= 4 && cc >= 2 && cc <= 4) return true;
      return false;
    }
    // Bottom-left
    if (r >= matrixSize - 7 && c < 7) {
      const rr = r - (matrixSize - 7);
      if (rr === 0 || rr === 6 || c === 0 || c === 6) return true;
      if (rr >= 2 && rr <= 4 && c >= 2 && c <= 4) return true;
      return false;
    }
    return false;
  };

  // Deterministic hash pattern for content modules
  const isDarkCell = (r, c) => {
    if (isCorner(r, c)) {
      return isCornerDark(r, c);
    }
    // Timing patterns
    if (r === 6) return c % 2 === 0;
    if (c === 6) return r % 2 === 0;

    // Pseudo-random deterministic module distribution
    return ((r * 13 + c * 37 + (r ^ c)) % 3) !== 0;
  };

  const rows = [];
  for (let r = 0; r < matrixSize; r++) {
    const cells = [];
    for (let c = 0; c < matrixSize; c++) {
      const dark = isDarkCell(r, c);
      cells.push(
        <View
          key={`${r}-${c}`}
          style={{
            width: cellSize,
            height: cellSize,
            backgroundColor: dark ? '#0F172A' : '#FFFFFF',
          }}
        />
      );
    }
    rows.push(
      <View key={`row-${r}`} style={{ flexDirection: 'row' }}>
        {cells}
      </View>
    );
  }

  return (
    <View style={[styles.qrCanvas, { width: cellSize * matrixSize, height: cellSize * matrixSize }]}>
      {rows}
      {/* Center Logo Icon */}
      <View style={styles.qrCenterLogo}>
        <Icon name="bike" size={16} color={COLORS.primary} />
      </View>
    </View>
  );
};

export const QRCodePayment = ({
  amount = 24.5,
  currency = 'USD',
  qrStatus = 'pending', // 'pending' | 'verifying' | 'success' | 'failed'
  onCheckStatus,
  onSimulateSuccess,
  checking = false,
  disabled = false,
}) => {
  const [countdown, setCountdown] = useState(299); // 5 min countdown

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const formattedAmount = formatCurrency(amount, currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency);

  return (
    <View style={styles.container}>
      {/* QR Code Presentation Box */}
      <View style={styles.qrCard}>
        {/* Header Tag */}
        <View style={styles.cardHeader}>
          <View style={styles.liveTag}>
            <View style={styles.livePulseDot} />
            <Text style={styles.liveTagText}>SCAN & PAY</Text>
          </View>
          <Text style={styles.countdownText}>Expires in {timeFormatted}</Text>
        </View>

        {/* QR Code Graphic Frame */}
        <View style={styles.qrFrameContainer}>
          {/* 4 Corner Markers */}
          <View style={[styles.cornerMarker, styles.cornerTL]} />
          <View style={[styles.cornerMarker, styles.cornerTR]} />
          <View style={[styles.cornerMarker, styles.cornerBL]} />
          <View style={[styles.cornerMarker, styles.cornerBR]} />

          <QRCodeMatrix size={190} />
        </View>

        {/* Amount Section */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>PAYMENT AMOUNT</Text>
          <Text style={styles.amountValue}>{formattedAmount}</Text>
        </View>

        {/* Instructions */}
        <Text style={styles.instructions}>
          Scan with any Banking App, Google Pay, Apple Pay, PhonePe, or UPI Wallet to complete payment.
        </Text>

        {/* Status indicator bar */}
        <View
          style={[
            styles.statusBanner,
            qrStatus === 'success'
              ? styles.statusBannerSuccess
              : qrStatus === 'failed'
              ? styles.statusBannerFailed
              : styles.statusBannerPending,
          ]}
        >
          <Icon
            name={
              qrStatus === 'success'
                ? 'check-circle'
                : qrStatus === 'failed'
                ? 'alert-circle'
                : 'time'
            }
            size={16}
            color={
              qrStatus === 'success'
                ? '#047857'
                : qrStatus === 'failed'
                ? '#B91C1C'
                : '#B45309'
            }
          />
          <Text
            style={[
              styles.statusBannerText,
              qrStatus === 'success'
                ? { color: '#047857' }
                : qrStatus === 'failed'
                ? { color: '#B91C1C' }
                : { color: '#B45309' },
            ]}
          >
            {qrStatus === 'success'
              ? 'Payment Received Successfully!'
              : qrStatus === 'failed'
              ? 'Payment Failed or Expired'
              : 'Awaiting Customer Scan & Payment...'}
          </Text>
        </View>

        {/* Check Status Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={checking || disabled}
          onPress={onCheckStatus}
          style={[styles.checkBtn, checking && styles.checkBtnDisabled]}
        >
          {checking ? (
            <ActivityIndicator size="small" color={COLORS.primaryDark} />
          ) : (
            <>
              <Icon name="refresh" size={16} color={COLORS.primaryDark} />
              <Text style={styles.checkBtnText}>Check Payment Status</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Quick Demo Simulator for rapid testing */}
        {onSimulateSuccess && qrStatus !== 'success' && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onSimulateSuccess}
            style={styles.simulateBtn}
          >
            <Text style={styles.simulateBtnText}>
              ⚡ Simulate Customer Completed Payment
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  qrCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondPrimaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.round,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.secondPrimary,
    marginRight: 6,
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.secondPrimary,
    letterSpacing: 0.5,
  },
  countdownText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.textLight,
    fontSize: 11,
  },
  qrFrameContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.medium,
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.md,
  },
  qrCanvas: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCenterLogo: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  cornerMarker: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderColor: COLORS.primary,
  },
  cornerTL: {
    top: 4,
    left: 4,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTR: {
    top: 4,
    right: 4,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBL: {
    bottom: 4,
    left: 4,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBR: {
    bottom: 4,
    right: 4,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  amountLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textLight,
    letterSpacing: 0.5,
  },
  amountValue: {
    ...TYPOGRAPHY.h1,
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 2,
  },
  instructions: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
    lineHeight: 16,
    marginBottom: SPACING.md,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.medium,
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  statusBannerPending: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusBannerSuccess: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusBannerFailed: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  statusBannerText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    flex: 1,
  },
  checkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 48,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    gap: 8,
  },
  checkBtnDisabled: {
    opacity: 0.6,
  },
  checkBtnText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  simulateBtn: {
    marginTop: SPACING.sm,
    paddingVertical: 6,
  },
  simulateBtnText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.secondPrimary,
    textDecorationLine: 'underline',
  },
});

export default QRCodePayment;
