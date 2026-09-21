import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { TYPOGRAPHY } from '../theme/typography';
import Icon from './Icon';

export const RatingStars = ({
  rating = 0,
  maxStars = 5,
  size = 24,
  interactive = false,
  onRatingChange,
  showScore = false,
  style,
}) => {
  const stars = Array.from({ length: maxStars }, (_, i) => i + 1);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.starsRow}>
        {stars.map((starIndex) => {
          const isFilled = starIndex <= Math.round(rating);
          const starColor = isFilled ? COLORS.primary : COLORS.border;

          if (interactive) {
            return (
              <TouchableOpacity
                key={starIndex}
                activeOpacity={0.7}
                onPress={() => onRatingChange && onRatingChange(starIndex)}
                style={styles.starTouch}
              >
                <Icon
                  name={isFilled ? 'star' : 'star-outline'}
                  size={size}
                  color={starColor}
                />
              </TouchableOpacity>
            );
          }

          return (
            <View key={starIndex} style={styles.starWrapper}>
              <Icon
                name={isFilled ? 'star' : 'star-outline'}
                size={size}
                color={starColor}
              />
            </View>
          );
        })}
      </View>

      {showScore && (
        <Text style={styles.scoreText}>
          {Number(rating).toFixed(1)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starTouch: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  starWrapper: {
    marginRight: 2,
  },
  scoreText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: SPACING.xs,
  },
});

export default RatingStars;
