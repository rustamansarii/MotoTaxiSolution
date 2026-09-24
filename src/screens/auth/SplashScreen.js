import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';

import { APP_NAME } from '../../utils/constants';
import { useResponsive } from '../../utils/responsive';

const GREEN = '#17baa1';
const WHITE = '#FFFFFF';

export const SplashScreen = ({ navigation }) => {
  const { width, height, isCompact } = useResponsive();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const cityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 45,
        friction: 7,
        useNativeDriver: true,
      }),

      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),

      Animated.timing(cityAnim, {
        toValue: 1,
        duration: 1000,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 2200);

    return () => clearTimeout(timer);
  }, [navigation]);

  const handleContinue = () => {
    navigation.replace('Login');
  };

  return (
    <TouchableWithoutFeedback onPress={handleContinue}>
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={GREEN}
          translucent={false}
        />

        {/* Main Content */}
        <Animated.View
          style={[
            styles.content,
            {
              marginBottom: height * 0.08,
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Logo */}
          <View style={styles.logoBox}>
            <View style={styles.steeringWheel}>
              {/* Outer wheel */}
              <View style={styles.wheelOuter} />

              {/* Steering center */}
              <View style={styles.wheelCenter} />

              {/* Left spoke */}
              <View style={styles.leftSpoke} />

              {/* Right spoke */}
              <View style={styles.rightSpoke} />

              {/* Bottom spoke */}
              <View style={styles.bottomSpoke} />
            </View>
          </View>

          {/* App Name */}
          <Text style={[styles.appName, isCompact && { fontSize: 36 }]}>
            {APP_NAME || 'Moto Taxi'}
          </Text>
        </Animated.View>

        {/* City Skyline */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.cityWrapper,
            {
              opacity: cityAnim,
              transform: [
                {
                  translateY: cityAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [35, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Back buildings */}
          <View style={styles.skylineBack}>
            <Building height={55} width={18} />
            <Building height={78} width={24} />
            <Building height={48} width={18} />
            <Building height={95} width={27} />
            <Building height={62} width={20} />
            <Building height={85} width={23} />
            <Building height={50} width={19} />
            <Building height={72} width={24} />
            <Building height={45} width={18} />
            <Building height={88} width={25} />
            <Building height={60} width={20} />
            <Building height={75} width={23} />
          </View>

          {/* Front buildings */}
          <View style={styles.skylineFront}>
            <Building height={42} width={25} />
            <Building height={58} width={30} />
            <Building height={38} width={22} />
            <Building height={68} width={32} />
            <Building height={48} width={26} />
            <Building height={62} width={29} />
            <Building height={40} width={24} />
            <Building height={55} width={31} />
            <Building height={36} width={22} />
            <Building height={60} width={28} />
            <Building height={45} width={25} />
            <Building height={52} width={29} />
          </View>

          {/* Bottom fade */}
          <View style={styles.cityBottom} />
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

/* --------------------------------
   Building Component
-------------------------------- */

const Building = ({ height, width }) => {
  return (
    <View
      style={[
        styles.building,
        {
          height,
          width,
        },
      ]}
    />
  );
};

/* --------------------------------
   Styles
-------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  /* --------------------------------
     Logo
  -------------------------------- */

  logoBox: {
    width: 96,
    height: 96,
    backgroundColor: WHITE,
    borderRadius: 24,
    alignItems: 'center',

    borderRadius: 25,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 18,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,

    elevation: 5,
  },

  /* --------------------------------
     Steering Wheel Logo
  -------------------------------- */

  steeringWheel: {
    width: 53,
    height: 53,

    alignItems: 'center',
    justifyContent: 'center',
  },

  wheelOuter: {
    position: 'absolute',

    width: 49,
    height: 49,

    borderWidth: 4,
    borderColor: GREEN,

    borderRadius: 50,
  },

  wheelCenter: {
    position: 'absolute',

    width: 18,
    height: 12,

    borderWidth: 3,
    borderColor: GREEN,

    borderRadius: 12,

    top: 18,
  },

  leftSpoke: {
    position: 'absolute',

    width: 20,
    height: 3,

    backgroundColor: GREEN,

    transform: [
      {
        rotate: '25deg',
      },
    ],

    left: 6,
    top: 30,

    borderRadius: 3,
  },

  rightSpoke: {
    position: 'absolute',

    width: 20,
    height: 3,

    backgroundColor: GREEN,

    transform: [
      {
        rotate: '-25deg',
      },
    ],

    right: 6,
    top: 30,

    borderRadius: 3,
  },

  bottomSpoke: {
    position: 'absolute',

    width: 25,
    height: 3,

    backgroundColor: GREEN,

    bottom: 7,

    borderRadius: 3,
  },

  /* --------------------------------
     App Name
  -------------------------------- */

  appName: {
    color: WHITE,
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: 0,
    textAlign: 'center',
  },

  /* --------------------------------
     City
  -------------------------------- */

  cityWrapper: {
    position: 'absolute',

    bottom: 0,

    left: 0,
    right: 0,

    height: '25%',

    justifyContent: 'flex-end',

    overflow: 'hidden',

    zIndex: 2,
  },

  skylineBack: {
    position: 'absolute',

    bottom: 15,

    left: -15,
    right: -15,

    height: 120,

    flexDirection: 'row',

    alignItems: 'flex-end',

    justifyContent: 'space-around',
  },

  skylineFront: {
    position: 'absolute',

    bottom: 0,

    left: -20,
    right: -20,

    height: 100,

    flexDirection: 'row',

    alignItems: 'flex-end',

    justifyContent: 'space-around',
  },

  building: {
    backgroundColor: 'rgba(255,255,255,0.13)',

    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },

  cityBottom: {
    position: 'absolute',

    bottom: 0,

    left: 0,
    right: 0,

    height: 25,

    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});

export default SplashScreen;