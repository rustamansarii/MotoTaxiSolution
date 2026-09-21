import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useResponsive } from '../utils/responsive';

/**
 * ResponsiveContainer
 * Centers and clamps content to a maximum width on wide unfolded screens
 * while seamlessly taking 100% width on phone cover screens.
 */
export const ResponsiveContainer = ({
  children,
  maxWidth,
  style,
  contentContainerStyle,
  scrollable = false,
  showsVerticalScrollIndicator = false,
  ...props
}) => {
  const { isFoldableOrTablet, contentMaxWidth } = useResponsive();
  const effectiveMaxWidth = maxWidth || (isFoldableOrTablet ? 640 : '100%');

  const containerInnerStyle = [
    styles.inner,
    {
      maxWidth: effectiveMaxWidth,
    },
    style,
  ];

  if (scrollable) {
    return (
      <ScrollView
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        {...props}
      >
        <View style={containerInnerStyle}>{children}</View>
      </ScrollView>
    );
  }

  return <View style={containerInnerStyle} {...props}>{children}</View>;
};

const styles = StyleSheet.create({
  inner: {
    width: '100%',
    alignSelf: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    width: '100%',
  },
});

export default ResponsiveContainer;
