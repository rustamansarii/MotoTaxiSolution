import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { TYPOGRAPHY } from '../theme/typography';
import Icon from './Icon';

const { width } = Dimensions.get('window');

export const CustomAlertPopup = ({
  visible = false,
  type = 'info', // 'success' | 'error' | 'warning' | 'info'
  title,
  message,
  confirmText = 'OK',
  cancelText,
  onConfirm,
  onCancel,
  onClose,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 75,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  // Type configuration
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'check',
          iconColor: '#10B981',
          badgeBg: '#D1FAE5',
          btnBg: COLORS.primary,
          defaultTitle: 'Success',
        };
      case 'error':
        return {
          icon: 'close',
          iconColor: '#EF4444',
          badgeBg: '#FEE2E2',
          btnBg: '#EF4444',
          defaultTitle: 'Error',
        };
      case 'warning':
        return {
          icon: 'alert-triangle',
          iconColor: '#F59E0B',
          badgeBg: '#FEF3C7',
          btnBg: '#F59E0B',
          defaultTitle: 'Warning',
        };
      case 'info':
      default:
        return {
          icon: 'info',
          iconColor: COLORS.primary,
          badgeBg: COLORS.primaryLight,
          btnBg: COLORS.primary,
          defaultTitle: 'Information',
        };
    }
  };

  const config = getTypeConfig();
  const displayTitle = title || config.defaultTitle;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else if (onClose) {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Circular Badge */}
          <View style={[styles.badge, { backgroundColor: config.badgeBg }]}>
            <Icon name={config.icon} size={30} color={config.iconColor} />
          </View>

          {/* Title */}
          <Text style={styles.titleText}>{displayTitle}</Text>

          {/* Message */}
          {message ? <Text style={styles.messageText}>{message}</Text> : null}

          {/* Button Actions */}
          <View style={styles.buttonsContainer}>
            {cancelText ? (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleCancel}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleConfirm}
              style={[
                styles.confirmButton,
                { backgroundColor: config.btnBg },
                !cancelText && styles.confirmButtonFull,
              ]}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    zIndex: 9999,
  },
  card: {
    width: Math.min(width - 48, 380),
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingTop: 32,
    paddingBottom: 22,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 12,
  },
  badge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  titleText: {
    ...TYPOGRAPHY.h3,
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  messageText: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 6,
  },
  buttonsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.medium,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
  },
  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.medium,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmButtonFull: {
    flex: 1,
    width: '100%',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default CustomAlertPopup;
