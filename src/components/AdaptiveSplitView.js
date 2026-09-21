import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useResponsive } from '../utils/responsive';

/**
 * AdaptiveSplitView
 * Provides an adaptive two-pane layout for foldable devices.
 * - On narrow phone portrait: Stacks primary (e.g., Map) & secondary (e.g., Controls) vertically.
 * - On unfolded / landscape screens: Displays primary on left and secondary on right.
 */
export const AdaptiveSplitView = ({
  primaryPane,
  secondaryPane,
  primaryRatio = 0.52,
  style,
  primaryStyle,
  secondaryStyle,
  forceStack = false,
}) => {
  const { isSplitLayout } = useResponsive();
  const shouldSplit = isSplitLayout && !forceStack;

  if (shouldSplit) {
    const leftWidth = `${Math.round(primaryRatio * 100)}%`;
    const rightWidth = `${Math.round((1 - primaryRatio) * 100)}%`;

    return (
      <View style={[styles.rowContainer, style]}>
        <View style={[styles.splitLeft, { width: leftWidth }, primaryStyle]}>
          {primaryPane}
        </View>
        <View style={[styles.splitRight, { width: rightWidth }, secondaryStyle]}>
          {secondaryPane}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.columnContainer, style]}>
      <View style={[styles.stackedPrimary, primaryStyle]}>{primaryPane}</View>
      <View style={[styles.stackedSecondary, secondaryStyle]}>{secondaryPane}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  rowContainer: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    height: '100%',
  },
  splitLeft: {
    height: '100%',
  },
  splitRight: {
    height: '100%',
  },
  columnContainer: {
    flex: 1,
    flexDirection: 'column',
    width: '100%',
    height: '100%',
  },
  stackedPrimary: {
    width: '100%',
  },
  stackedSecondary: {
    flex: 1,
    width: '100%',
  },
});

export default AdaptiveSplitView;
