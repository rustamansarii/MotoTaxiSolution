import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { TYPOGRAPHY } from '../theme/typography';
import { useResponsive } from '../utils/responsive';
import Icon from './Icon';
import CustomButton from './CustomButton';

export const CustomModal = ({
  visible = false,
  onClose,
  title,
  message,
  icon,
  iconColor,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  isDanger = false,
  children,
  showCancel = true,
}) => {
  const { width, height, modalMaxWidth, isCompact } = useResponsive();

  const dynamicCardStyle = {
    maxWidth: modalMaxWidth,
    maxHeight: Math.min(height * 0.88, 600),
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalCard, dynamicCardStyle]}>
              <ScrollView
                bounces={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
              {/* Optional Icon Header */}
              {icon && (
                <View
                  style={[
                    styles.iconWrapper,
                    isDanger && styles.dangerIconWrapper,
                  ]}
                >
                  <Icon
                    name={icon}
                    size={28}
                    color={
                      iconColor ||
                      (isDanger ? COLORS.danger : COLORS.primary)
                    }
                  />
                </View>
              )}

              {/* Title & Message */}
              {title ? <Text style={styles.title}>{title}</Text> : null}
              {message ? <Text style={styles.message}>{message}</Text> : null}

              {/* Custom children */}
              {children}

              {/* Actions */}
              <View style={styles.actionsRow}>
                {showCancel && (
                  <CustomButton
                    title={cancelText}
                    variant="outline"
                    onPress={onClose}
                    style={styles.actionBtn}
                  />
                )}
                <CustomButton
                  title={confirmText}
                  variant={isDanger ? 'danger' : 'primary'}
                  onPress={onConfirm || onClose}
                  style={styles.actionBtn}
                />
              </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 28, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.extraLarge,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  scrollContent: {
    alignItems: 'center',
    width: '100%',
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  dangerIconWrapper: {
    backgroundColor: COLORS.inputBg,
  },
  title: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  message: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
    marginTop: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
  },
});

export default CustomModal;
