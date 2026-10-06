import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import CustomModal from '../../components/CustomModal';
import CustomButton from '../../components/CustomButton';
import Icon from '../../components/Icon';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import { useResponsive, responsiveFont } from '../../utils/responsive';
import { useTranslation } from 'react-i18next';
import { deleteUserAccount } from '../../redux/features/auth/authSlice';
import { clearTokens } from '../../utils/storage';

const DELETE_REASONS = [
  'I no longer need this service',
  'Privacy and data concerns',
  'Ride prices are too high',
  'Poor app or driver experience',
  'Created a duplicate account',
  'Other reason',
];

export const DeleteAccountScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { isFoldableOrTablet, insets } = useResponsive();

  const [selectedReason, setSelectedReason] = useState(DELETE_REASONS[0]);
  const [confirmedCheckbox, setConfirmedCheckbox] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const authUser = useSelector((state) => state.auth?.user);

  const handleInitiateDelete = () => {
    if (!confirmedCheckbox) {
      Alert.alert(
        'Confirmation Required',
        'Please acknowledge that this action is permanent by checking the confirmation box below.'
      );
      return;
    }
    setShowConfirmModal(true);
  };

  const handleExecuteDelete = async () => {
    setShowConfirmModal(false);
    setIsDeleting(true);

    try {
      console.log('[DeleteAccount] Calling delete API with reason:', selectedReason);
      const resultAction = await dispatch(
        deleteUserAccount({
          reason: selectedReason,
          user_id: authUser?.id || authUser?.user_id,
        })
      );

      if (deleteUserAccount.fulfilled.match(resultAction)) {
        console.log('[DeleteAccount] Account successfully deleted');
        await clearTokens();
        setShowSuccessModal(true);
      } else {
        const errorMsg =
          resultAction.payload || 'Failed to delete account. Please try again.';
        console.warn('[DeleteAccount] Deletion failed:', errorMsg);
        Alert.alert('Deletion Failed', String(errorMsg));
      }
    } catch (err) {
      console.error('[DeleteAccount] Error during deletion:', err);
      Alert.alert(
        'Error',
        'An unexpected error occurred while deleting your account. Please check your connection and try again.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFinishAndRedirect = async () => {
    setShowSuccessModal(false);
    await clearTokens();
    navigation.reset({
      index: 0,
      routes: [{ name: 'RoleSelection' }],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ResponsiveContainer maxWidth={760} style={{ flex: 1 }}>
        <Header
          title={t('auth.deleteAccountTitle', 'Delete Account')}
          onBack={() => navigation.goBack()}
          variant="light"
        />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + SPACING.xl, SPACING.xxxl) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Warning Icon & Header */}
          <View style={styles.warningHero}>
            <View style={styles.warningIconCircle}>
              <Icon name="alert-triangle" size={32} color={COLORS.danger} />
            </View>
            <Text style={styles.warningTitle}>
              {t('auth.deleteAccountHeading', 'Are you sure you want to delete your account?')}
            </Text>
            <Text style={styles.warningSubtitle}>
              This action is permanent and cannot be undone. All your personal data and account records will be permanently erased.
            </Text>
          </View>

          {/* Consequences Card */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>What will happen:</Text>

            <View style={styles.pointRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.pointText}>
                Your profile, contact details, and authentication credentials will be erased.
              </Text>
            </View>

            <View style={styles.pointRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.pointText}>
                All active bookings, ride histories, and saved places (Home & Work) will be wiped.
              </Text>
            </View>

            <View style={styles.pointRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.pointText}>
                Any active wallet balance, promotional credits, or rewards will be forfeited.
              </Text>
            </View>

            <View style={styles.pointRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.pointText}>
                You will immediately be logged out of Moto Taxi across all devices.
              </Text>
            </View>
          </View>

          {/* Reason Selection */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Please select a reason for leaving:</Text>
            {DELETE_REASONS.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  activeOpacity={0.7}
                  onPress={() => setSelectedReason(reason)}
                  style={[styles.reasonOption, isSelected && styles.reasonOptionSelected]}
                >
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                  <Text
                    style={[styles.reasonText, isSelected && styles.reasonTextSelected]}
                  >
                    {reason}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Confirmation Checkbox */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setConfirmedCheckbox(!confirmedCheckbox)}
            style={styles.checkboxContainer}
          >
            <View style={[styles.checkbox, confirmedCheckbox && styles.checkboxActive]}>
              {confirmedCheckbox && <Icon name="check" size={14} color={COLORS.white} />}
            </View>
            <Text style={styles.checkboxLabel}>
              I understand that deleting my account is permanent and cannot be reversed or recovered.
            </Text>
          </TouchableOpacity>

          {/* Delete Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleInitiateDelete}
              disabled={isDeleting || !confirmedCheckbox}
              style={[
                styles.deleteBtn,
                (!confirmedCheckbox || isDeleting) && styles.deleteBtnDisabled,
              ]}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Icon name="alert-triangle" size={18} color={COLORS.white} style={{ marginRight: 8 }} />
                  <Text style={styles.deleteBtnText}>Permanently Delete My Account</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
              disabled={isDeleting}
              style={styles.keepAccountBtn}
            >
              <Text style={styles.keepAccountText}>Keep My Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ResponsiveContainer>

      {/* Confirmation Modal */}
      <CustomModal
        visible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Final Confirmation"
        message="Are you completely sure you want to permanently delete your account? All your ride data and account history will be permanently deleted from our servers."
        confirmText="Yes, Delete Permanently"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleExecuteDelete}
        icon="alert-triangle"
      />

      {/* Success Modal */}
      <CustomModal
        visible={showSuccessModal}
        onClose={handleFinishAndRedirect}
        title="Account Deleted"
        message="Your account has been deleted successfully. We hope to see you again in the future!"
        confirmText="Done"
        showCancel={false}
        onConfirm={handleFinishAndRedirect}
        icon="check-circle"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  warningHero: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  warningIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  warningTitle: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  warningSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  cardSectionTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.danger,
    marginTop: 7,
    marginRight: SPACING.sm,
  },
  pointText: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(13),
    color: COLORS.text,
    lineHeight: Math.round(responsiveFont(13) * 1.45),
    flex: 1,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.xs,
  },
  reasonOptionSelected: {
    backgroundColor: '#FEF2F2',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  radioCircleSelected: {
    borderColor: COLORS.danger,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.danger,
  },
  reasonText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    flex: 1,
  },
  reasonTextSelected: {
    fontWeight: '700',
    color: COLORS.danger,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    backgroundColor: COLORS.white,
  },
  checkboxActive: {
    backgroundColor: COLORS.danger,
  },
  checkboxLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(12),
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    lineHeight: Math.round(responsiveFont(12) * 1.5),
  },
  actionsContainer: {
    gap: SPACING.md,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.large,
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteBtnDisabled: {
    backgroundColor: '#F87171',
    opacity: 0.6,
    elevation: 0,
    shadowOpacity: 0,
  },
  deleteBtnText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.white,
  },
  keepAccountBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.large,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  keepAccountText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
});

export default DeleteAccountScreen;
