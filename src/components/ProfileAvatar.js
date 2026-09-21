import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { TYPOGRAPHY } from '../theme/typography';
import Icon from './Icon';

export const ProfileAvatar = ({
  name = 'User',
  imageUrl,
  size = 64,
  showEdit = false,
  onEditPress,
  isOnline = false,
  showStatus = false,
  style,
}) => {
  const getInitials = (n) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const fontSize = size * 0.38;

  return (
    <View style={[styles.wrapper, { width: size, height: size }, style]}>
      <View
        style={[
          styles.avatarCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
            }}
          />
        ) : (
          <Text style={[styles.initialsText, { fontSize }]}>
            {getInitials(name)}
          </Text>
        )}
      </View>

      {/* Online indicator badge */}
      {showStatus && (
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isOnline ? COLORS.primary : COLORS.iconLight,
            },
          ]}
        />
      )}

      {/* Edit button */}
      {showEdit && onEditPress && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onEditPress}
          style={styles.editButton}
        >
          <Icon name="camera" size={14} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    backgroundColor: COLORS.backgroundglass,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initialsText: {
    ...TYPOGRAPHY.title,
    fontWeight: '700',
    color: COLORS.white,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: RADIUS.round,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.secondPrimary,
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProfileAvatar;
