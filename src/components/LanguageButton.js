import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { TYPOGRAPHY, responsiveFont } from '../theme/typography';
import Icon from './Icon';
import { LanguageModal } from './LanguageModal';

export const LanguageButton = ({
  style,
  variant = 'light',
  showGlobe = true,
  showFlag = true,
  short = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { t } = useTranslation();
  const { language } = useApp();

  const isDark = variant === 'dark';
  let flag = '🇺🇸';
  let name = 'English';

  if (language === 'hi') {
    flag = '🇮🇳';
    name = short ? 'HI' : 'हिन्दी';
  } else if (language === 'fr') {
    flag = '🇫🇷';
    name = short ? 'FR' : 'Français';
  } else {
    flag = '🇺🇸';
    name = short ? 'EN' : 'English';
  }

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => setModalVisible(true)}
        style={[
          styles.container,
          isDark ? styles.containerDark : styles.containerLight,
          style,
        ]}
      >
        {showGlobe && (
          <Icon
            name="globe"
            size={13}
            color={isDark ? COLORS.white : COLORS.primary}
            style={styles.globeIcon}
          />
        )}
        {showFlag && (
          <Text style={styles.flagText}>{flag}</Text>
        )}
        <Text
          numberOfLines={1}
          ellipsizeMode="clip"
          style={[styles.text, isDark && styles.textDark]}
        >
          {name}
        </Text>
        <Icon
          name="chevron-down"
          size={11}
          color={isDark ? 'rgba(255, 255, 255, 0.85)' : COLORS.textLight}
          style={styles.chevronIcon}
        />
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
    justifyContent: 'center',
    borderRadius: RADIUS.round,
    paddingHorizontal: 10,
    paddingVertical: 5,
    height: 34,
    minHeight: 34,
    flexWrap: 'nowrap',
    flexShrink: 0,
  },
  containerLight: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  containerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  globeIcon: {
    marginRight: 4,
  },
  flagText: {
    fontSize: responsiveFont(14),
    marginRight: 4,
    includeFontPadding: false,
    lineHeight: Math.round(responsiveFont(14) * 1.2),
  },
  text: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(12),
    fontWeight: '600',
    color: COLORS.text,
    includeFontPadding: false,
    marginRight: 3,
  },
  textDark: {
    color: COLORS.white,
  },
  chevronIcon: {
    marginTop: 1,
  },
});

export default LanguageButton;
