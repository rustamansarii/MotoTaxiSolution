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
  {
    code: 'en',
    nativeName: 'English',
    englishName: 'English',
    flag: '🇺🇸',
  },
  {
    code: 'hi',
    nativeName: 'हिन्दी',
    englishName: 'Hindi',
    flag: '🇮🇳',
  },
  {
    code: 'fr',
    nativeName: 'Français',
    englishName: 'French',
    flag: '🇫🇷',
  },
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
                    <View style={styles.flagBadge}>
                      <Text style={styles.flag}>{lang.flag}</Text>
                    </View>
                    <View style={styles.nameCol}>
                      <Text
                        style={[
                          styles.langNativeName,
                          isSelected && styles.selectedLangNativeName,
                        ]}
                      >
                        {lang.nativeName}
                      </Text>
                      <Text style={styles.langSublabel}>
                        {lang.englishName} ({lang.code.toUpperCase()})
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.selectedRadioCircle,
                    ]}
                  >
                    {isSelected ? (
                      <Icon name="check" size={13} color={COLORS.white} />
                    ) : null}
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
  flagBadge: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  flag: {
    fontSize: 24,
    lineHeight: 28,
  },
  nameCol: {
    justifyContent: 'center',
  },
  langNativeName: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  selectedLangNativeName: {
    color: COLORS.primaryDark,
  },
  langSublabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 1,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  selectedRadioCircle: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
});

export default LanguageModal;
