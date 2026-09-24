import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { TYPOGRAPHY } from '../theme/typography';
import Icon from './Icon';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', nameKey: 'settings.english', defaultName: 'English', flag: '🇺🇸' },
  { code: 'fr', nameKey: 'settings.french', defaultName: 'Français', flag: '🇫🇷' },
];

export const LanguageModal = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const { language, setLanguage } = useApp();

  const handleSelectLanguage = (code) => {
    setLanguage(code);
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Icon name="globe" size={20} color={COLORS.primary} />
              <Text style={styles.title}>
                {t('settings.selectLanguage', 'Select Language')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="x" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          <View style={styles.list}>
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  activeOpacity={0.7}
                  onPress={() => handleSelectLanguage(lang.code)}
                  style={[
                    styles.langItem,
                    isSelected && styles.selectedLangItem,
                  ]}
                >
                  <View style={styles.langLeft}>
                    <Text style={styles.flag}>{lang.flag}</Text>
                    <View>
                      <Text
                        style={[
                          styles.langName,
                          isSelected && styles.selectedLangName,
                        ]}
                      >
                        {t(lang.nameKey, lang.defaultName)}
                      </Text>
                      <Text style={styles.langCode}>
                        {lang.code.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.selectedRadioCircle,
                    ]}
                  >
                    {isSelected && (
                      <View style={styles.radioDot} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    marginBottom: SPACING.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  title: {
    ...TYPOGRAPHY.h3,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 6,
  },
  closeButton: {
    padding: 4,
  },
  list: {
    gap: SPACING.sm,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.background,
  },
  selectedLangItem: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  flag: {
    fontSize: 26,
    marginRight: 4,
  },
  langName: {
    ...TYPOGRAPHY.body,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  selectedLangName: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  langCode: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.textLight,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioCircle: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
});

export default LanguageModal;
