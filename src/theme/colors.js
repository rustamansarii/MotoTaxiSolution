export const COLORS = {
  primary: '#17baa1',
  primaryDark: '#17baa1',
  primaryLight: '#D9F9EE',
  secondPrimary: '#4154FE',
  secondPrimaryDark: '#3548E8',
  secondPrimaryLight: '#EEF0FF',
  background: '#F7F8F7',
  white: '#FFFFFF',
  backgroundglass: '#12352B',
  secondBackgroundglass: '#0F5C4C',
  text: '#111827',
  textLight: '#8A8F98',
  textMuted: '#A7ADB5',
  inputBg: '#F7F8F7',
  cardBackground: '#FFFFFF',
  border: '#E8E9EC',
  borderLight: '#F0F1F3',
  danger: '#E53935',
  warning: '#FFC107',
  success: '#4CE4B1',
  iconLight: '#999999',
  icon: '#4B5563',
  overlay: 'rgba(0, 0, 0, 0.35)',
  disabled: '#D9DCE1',
  disabledText: '#A5A9B0',
  star: '#FFB800',
};

export const colors = {
  ...COLORS,
  text: {
    primary: COLORS.text,
    secondary: COLORS.textLight,
    muted: COLORS.textMuted,
  },
};

export default colors;