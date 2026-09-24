import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { TYPOGRAPHY } from '../theme/typography';
import Icon from './Icon';
import { LanguageModal } from './LanguageModal';

export const LanguageButton = ({ style, variant = 'light' }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { t } = useTranslation();
  const { language } = useApp();

  const isDark = variant === 'dark';
  const flag = language === 'fr' ? '🇫🇷' : '🇺🇸';
  const name = language === 'fr' ? t('settings.french', 'Français') : t('settings.english', 'English');

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
        style={[
          styles.container,
          isDark && styles.containerDark,
          style,
        ]}
      >
        <Icon name="globe" size={14} color={isDark ? COLORS.white : COLORS.primary} />
        <Text style={[styles.text, isDark && styles.textDark]}>
          {flag} {name}
        </Text>
        <Icon name="chevron-down" size={12} color={isDark ? COLORS.white : COLORS.textLight} />
      </TouchableOpacity>

      <LanguageModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.round,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  containerDark: {
    backgroundColor: COLORS.secondBackgroundglass,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  text: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  textDark: {
    color: COLORS.white,
  },
});

export default LanguageButton;
