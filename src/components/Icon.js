import React from 'react';
import { View, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { COLORS } from '../theme/colors';

const ICON_FAMILIES = {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  Feather,
  FontAwesome,
};

// Semantic map from app icon name to { family, name }
const ICON_MAP = {
  // Navigation & Direction
  'arrow-left': { family: 'Ionicons', name: 'arrow-back' },
  'back': { family: 'Ionicons', name: 'arrow-back' },
  'arrow-right': { family: 'Ionicons', name: 'arrow-forward' },
  'forward': { family: 'Ionicons', name: 'arrow-forward' },
  'arrow-up': { family: 'Ionicons', name: 'arrow-up' },
  'arrow-down': { family: 'Ionicons', name: 'arrow-down' },
  'chevron-right': { family: 'Ionicons', name: 'chevron-forward' },
  'chevron-left': { family: 'Ionicons', name: 'chevron-back' },
  'chevron-down': { family: 'Ionicons', name: 'chevron-down' },
  'chevron-up': { family: 'Ionicons', name: 'chevron-up' },
  'navigation': { family: 'Ionicons', name: 'navigate' },
  'crosshair': { family: 'Ionicons', name: 'locate' },
  'location': { family: 'Ionicons', name: 'location-sharp' },
  'map-pin': { family: 'Ionicons', name: 'location-sharp' },
  'flag': { family: 'Ionicons', name: 'flag' },
  'more-vertical': { family: 'Ionicons', name: 'ellipsis-vertical' },
  'dots-vertical': { family: 'Ionicons', name: 'ellipsis-vertical' },

  // Places & Common
  'home': { family: 'Ionicons', name: 'home' },
  'work': { family: 'Ionicons', name: 'briefcase' },
  'briefcase': { family: 'Ionicons', name: 'briefcase' },
  'search': { family: 'Ionicons', name: 'search' },

  // Rides & Vehicles
  'car': { family: 'Ionicons', name: 'car-sport' },
  'shield': { family: 'Ionicons', name: 'shield-checkmark' },
  'safety': { family: 'Ionicons', name: 'shield-checkmark' },
  'clock': { family: 'Ionicons', name: 'time-outline' },
  'time': { family: 'Ionicons', name: 'time-outline' },
  'star': { family: 'Ionicons', name: 'star' },
  'star-outline': { family: 'Ionicons', name: 'star-outline' },
  'heart': { family: 'Ionicons', name: 'heart' },
  'flash': { family: 'Ionicons', name: 'flash' },
  'trending-up': { family: 'Ionicons', name: 'trending-up' },
  'speedometer': { family: 'Ionicons', name: 'speedometer' },

  // User & Social
  'user': { family: 'Ionicons', name: 'person' },
  'profile': { family: 'Ionicons', name: 'person' },
  'users': { family: 'Ionicons', name: 'people' },
  'phone': { family: 'Ionicons', name: 'call' },
  'message': { family: 'Ionicons', name: 'chatbubble-ellipses' },
  'chat': { family: 'Ionicons', name: 'chatbubble-ellipses' },
  'share': { family: 'Ionicons', name: 'share-social' },
  'bell': { family: 'Ionicons', name: 'notifications' },
  'settings': { family: 'Ionicons', name: 'settings-sharp' },

  // Finance & Payments
  'wallet': { family: 'Ionicons', name: 'wallet' },
  'card': { family: 'Ionicons', name: 'card' },
  'cash': { family: 'Ionicons', name: 'cash' },
  'dollar-sign': { family: 'Ionicons', name: 'cash' },

  // Actions & Controls
  'check': { family: 'Ionicons', name: 'checkmark' },
  'check-circle': { family: 'Ionicons', name: 'checkmark-circle' },
  'close': { family: 'Ionicons', name: 'close' },
  'x': { family: 'Ionicons', name: 'close' },
  'plus': { family: 'Ionicons', name: 'add' },
  'minus': { family: 'Ionicons', name: 'remove' },
  'refresh': { family: 'Ionicons', name: 'refresh' },
  'filter': { family: 'Ionicons', name: 'filter' },
  'menu': { family: 'Ionicons', name: 'menu' },
  'info': { family: 'Ionicons', name: 'information-circle' },
  'alert-triangle': { family: 'Ionicons', name: 'warning' },
  'warning': { family: 'Ionicons', name: 'warning' },

  // Media & Documents
  'document': { family: 'Ionicons', name: 'document-text' },
  'file-text': { family: 'Ionicons', name: 'document-text' },
  'camera': { family: 'Ionicons', name: 'camera' },
  'radio': { family: 'Ionicons', name: 'radio-button-on' },
  'tag': { family: 'Ionicons', name: 'pricetag' },
  'gift': { family: 'Ionicons', name: 'gift' },
  'apple': { family: 'Ionicons', name: 'logo-apple' },
  'activity': { family: 'Ionicons', name: 'pulse' },
};

export const Icon = ({
  name,
  type,
  size = 20,
  color = COLORS.text,
  style,
  ...rest
}) => {
  let FamilyComponent = Ionicons;
  let iconName = name;

  if (type && ICON_FAMILIES[type]) {
    FamilyComponent = ICON_FAMILIES[type];
    iconName = name;
  } else if (ICON_MAP[name]) {
    const mapping = ICON_MAP[name];
    FamilyComponent = ICON_FAMILIES[mapping.family] || Ionicons;
    iconName = mapping.name;
  }

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <FamilyComponent
        name={iconName}
        size={size}
        color={color}
        {...rest}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Icon;
