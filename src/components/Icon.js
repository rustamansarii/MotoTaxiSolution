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
  'crosshairs': { family: 'Ionicons', name: 'locate' },
  'locate': { family: 'Ionicons', name: 'locate' },
  'location': { family: 'Ionicons', name: 'location-sharp' },
  'location-pin': { family: 'Ionicons', name: 'location-sharp' },
  'my-location': { family: 'MaterialIcons', name: 'my-location' },
  'gps': { family: 'MaterialIcons', name: 'my-location' },
  'map-pin': { family: 'Ionicons', name: 'location-sharp' },
  'map': { family: 'Ionicons', name: 'map-outline' },
  'map-outline': { family: 'Ionicons', name: 'map-outline' },
  'flag': { family: 'Ionicons', name: 'flag' },
  'more-vertical': { family: 'Ionicons', name: 'ellipsis-vertical' },
  'dots-vertical': { family: 'Ionicons', name: 'ellipsis-vertical' },

  // Places & Common
  'home': { family: 'Ionicons', name: 'home' },
  'work': { family: 'Ionicons', name: 'briefcase' },
  'briefcase': { family: 'Ionicons', name: 'briefcase' },
  'search': { family: 'Ionicons', name: 'search' },

  // Rides & Vehicles
  'bike': { family: 'MaterialCommunityIcons', name: 'motorbike' },
  'motorbike': { family: 'MaterialCommunityIcons', name: 'motorbike' },
  'motorcycle': { family: 'MaterialCommunityIcons', name: 'motorbike' },
  'bicycle': { family: 'MaterialCommunityIcons', name: 'motorbike' },
  'auto': { family: 'MaterialCommunityIcons', name: 'rickshaw' },
  'car': { family: 'MaterialCommunityIcons', name: 'car' },
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
  'credit-card': { family: 'Ionicons', name: 'card-outline' },
  'cash': { family: 'Ionicons', name: 'cash-outline' },
  'cash-solid': { family: 'Ionicons', name: 'cash' },
  'dollar-sign': { family: 'Ionicons', name: 'cash' },
  'qr-code': { family: 'Ionicons', name: 'qr-code-outline' },
  'qr': { family: 'Ionicons', name: 'qr-code' },
  'scan': { family: 'Ionicons', name: 'scan-outline' },
  'phone-portrait': { family: 'Ionicons', name: 'phone-portrait-outline' },
  'cellphone': { family: 'MaterialCommunityIcons', name: 'cellphone' },

  // Actions & Controls
  'check': { family: 'Ionicons', name: 'checkmark' },
  'check-circle': { family: 'Ionicons', name: 'checkmark-circle' },
  'close': { family: 'Ionicons', name: 'close' },
  'x': { family: 'Ionicons', name: 'close' },
  'plus': { family: 'Ionicons', name: 'add' },
  'plus-circle': { family: 'Ionicons', name: 'add-circle-outline' },
  'add-circle': { family: 'Ionicons', name: 'add-circle-outline' },
  'add-circle-outline': { family: 'Ionicons', name: 'add-circle-outline' },
  'minus': { family: 'Ionicons', name: 'remove' },
  'refresh': { family: 'Ionicons', name: 'refresh' },
  'megaphone': { family: 'Ionicons', name: 'megaphone-outline' },
  'bullhorn': { family: 'Ionicons', name: 'megaphone-outline' },
  'disc': { family: 'Ionicons', name: 'disc-outline' },
  'live': { family: 'Ionicons', name: 'radio-button-on' },
  'filter': { family: 'Ionicons', name: 'filter' },
  'menu': { family: 'Ionicons', name: 'menu' },
  'info': { family: 'Ionicons', name: 'information-circle' },
  'alert-triangle': { family: 'Ionicons', name: 'warning' },
  'alert-circle': { family: 'Ionicons', name: 'alert-circle' },
  'warning': { family: 'Ionicons', name: 'warning' },
  'trash': { family: 'Ionicons', name: 'trash-outline' },
  'trash-outline': { family: 'Ionicons', name: 'trash-outline' },
  'backspace': { family: 'Ionicons', name: 'backspace-outline' },
  'backspace-fill': { family: 'Ionicons', name: 'backspace' },
  'shift-key': { family: 'Ionicons', name: 'arrow-up' },
  'caps-lock': { family: 'Ionicons', name: 'arrow-up-circle' },
  'enter-key': { family: 'Ionicons', name: 'return-down-back' },
  'keyboard-hide': { family: 'Ionicons', name: 'chevron-down' },
  'pencil': { family: 'Ionicons', name: 'pencil' },
  'edit': { family: 'Ionicons', name: 'pencil' },
  'power': { family: 'Ionicons', name: 'power' },
  'power-outline': { family: 'Ionicons', name: 'power-outline' },

  // Security & Authentication
  'lock': { family: 'Ionicons', name: 'lock-closed' },
  'lock-closed': { family: 'Ionicons', name: 'lock-closed' },
  'lock-outline': { family: 'Ionicons', name: 'lock-closed-outline' },
  'unlock': { family: 'Ionicons', name: 'lock-open' },
  'key': { family: 'Ionicons', name: 'key' },
  'log-in': { family: 'Ionicons', name: 'log-in-outline' },
  'login': { family: 'Ionicons', name: 'log-in-outline' },
  'log-out': { family: 'Ionicons', name: 'log-out-outline' },
  'logout': { family: 'Ionicons', name: 'log-out-outline' },
  'eye': { family: 'Ionicons', name: 'eye-outline' },
  'eye-outline': { family: 'Ionicons', name: 'eye-outline' },
  'eye-off': { family: 'Ionicons', name: 'eye-off-outline' },
  'eye-off-outline': { family: 'Ionicons', name: 'eye-off-outline' },
  'eye-solid': { family: 'Ionicons', name: 'eye' },
  'globe': { family: 'Ionicons', name: 'globe-outline' },

  // Media & Documents
  'document': { family: 'Ionicons', name: 'document-text' },
  'file-text': { family: 'Ionicons', name: 'document-text' },
  'camera': { family: 'Ionicons', name: 'camera' },
  'image': { family: 'Ionicons', name: 'image' },
  'images': { family: 'Ionicons', name: 'images' },
  'radio': { family: 'Ionicons', name: 'radio-button-on' },
  'tag': { family: 'Ionicons', name: 'pricetag' },
  'gift': { family: 'Ionicons', name: 'gift' },
  'apple': { family: 'Ionicons', name: 'logo-apple' },
  'activity': { family: 'Ionicons', name: 'pulse' },
  'calendar': { family: 'Ionicons', name: 'calendar-outline' },
  'calendar-sharp': { family: 'Ionicons', name: 'calendar' },
};

export const Icon = ({
  name,
  type = undefined,
  size = 20,
  color = COLORS.text,
  style = undefined,
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
