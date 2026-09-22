import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Platform,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { SPACING } from '../../theme/spacing';
import { useResponsive } from '../../utils/responsive';
import {
  DEMO_TRIP,
  DEMO_DRIVER_PATH,
  DEMO_PROGRESS,
} from '../../data/mockNavigationData';
import {
  DemoMap,
  MapTopBar,
  TripInfoCard,
  RecenterButton,
} from '../../components/navigation';

/**
 * Helper to compute vehicle heading angle (0-360 deg) between two coordinates
 */
const calculateHeading = (fromCoord, toCoord) => {
  if (!fromCoord || !toCoord) return 45;
  const dLng = toCoord[0] - fromCoord[0];
  const dLat = toCoord[1] - fromCoord[1];
  const angle = (Math.atan2(dLng, dLat) * 180) / Math.PI;
  return (angle + 360) % 360;
};

/**
 * DriverMapScreen
 * Complete Uber-like driver navigation screen using MapLibre React Native.
 * Uses 100% static/mock data and local timer simulation.
 */
export const DriverMapScreen = ({ navigation, route }) => {
  const { isFoldableOrTablet, insets, width } = useResponsive();
  const mapRef = useRef(null);
  const timerRef = useRef(null);

  // Simulation State: 'IDLE' | 'RUNNING' | 'ARRIVING' | 'COMPLETED'
  const [tripState, setTripState] = useState('IDLE');
  const [pathIndex, setPathIndex] = useState(0);
  const [heading, setHeading] = useState(DEMO_TRIP.driver.heading || 45);

  // Current driver coordinate: [lng, lat]
  const currentCoord = DEMO_DRIVER_PATH[pathIndex] || DEMO_DRIVER_PATH[0];
  const currentProgress =
    DEMO_PROGRESS[Math.min(pathIndex, DEMO_PROGRESS.length - 1)] ||
    DEMO_PROGRESS[0];

  // Destination coordinate: [lng, lat]
  const destCoord = [
    DEMO_TRIP.destination.longitude,
    DEMO_TRIP.destination.latitude,
  ];

  /**
   * Start local timer-based trip animation
   */
  const handleStartTrip = () => {
    setTripState('RUNNING');
  };

  /**
   * Pause the demo trip
   */
  const handlePauseTrip = () => {
    setTripState('IDLE');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  /**
   * Finish trip immediately or exit
   */
  const handleFinishTrip = () => {
    if (tripState === 'COMPLETED') {
      navigation.goBack();
    } else {
      setPathIndex(DEMO_DRIVER_PATH.length - 1);
      setTripState('COMPLETED');
    }
  };

  /**
   * Reset the demo trip simulation back to start
   */
  const handleResetTrip = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPathIndex(0);
    setHeading(DEMO_TRIP.driver.heading || 45);
    setTripState('IDLE');
    if (mapRef.current?.recenter) {
      mapRef.current.recenter(DEMO_DRIVER_PATH[0], 14.5);
    }
  };

  /**
   * Re-center button (◎) handler: snaps camera to driver position
   */
  const handleRecenter = () => {
    if (mapRef.current?.recenter) {
      mapRef.current.recenter(currentCoord, 15);
    }
  };

  // Local simulated trip timer effect
  useEffect(() => {
    if (tripState === 'RUNNING') {
      timerRef.current = setInterval(() => {
        setPathIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;

          if (nextIndex >= DEMO_DRIVER_PATH.length - 1) {
            // Reached destination
            clearInterval(timerRef.current);
            timerRef.current = null;
            setTripState('COMPLETED');
            return DEMO_DRIVER_PATH.length - 1;
          }

          // Near destination state
          if (nextIndex >= DEMO_DRIVER_PATH.length - 3) {
            setTripState('ARRIVING');
          }

          // Update heading towards next coordinate
          const current = DEMO_DRIVER_PATH[prevIndex];
          const next = DEMO_DRIVER_PATH[nextIndex];
          const newHeading = calculateHeading(current, next);
          setHeading(newHeading);

          // Smoothly follow driver position with camera
          if (mapRef.current?.recenter) {
            mapRef.current.recenter(next, 15);
          }

          return nextIndex;
        });
      }, 1800); // Step every 1.8s for smooth visual progress
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [tripState]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Main MapLibre Map View occupying full screen */}
      <DemoMap
        ref={mapRef}
        driverCoordinate={currentCoord}
        driverHeading={heading}
        driverEta={currentProgress.duration}
        destinationCoordinate={destCoord}
        destinationTitle={DEMO_TRIP.destination.title}
        destinationAddress={DEMO_TRIP.destination.address}
        routeShape={DEMO_TRIP.route}
      />

      {/* UI Overlays container with pointerEvents='box-none' to permit map gestures */}
      <View style={styles.overlayContainer} pointerEvents="box-none">
        {/* Floating Top Bar: ← Trip ... ⋮ */}
        <MapTopBar
          title="Trip Navigation"
          onBack={() => navigation.goBack()}
          onMenu={() => {
            // Toggle demo states or options
            if (tripState === 'IDLE') {
              handleStartTrip();
            } else {
              handleResetTrip();
            }
          }}
        />

        {/* Floating Re-center Button (◎) positioned above the bottom card */}
        <View
          style={[
            styles.recenterWrapper,
            {
              bottom: isFoldableOrTablet ? 310 : 330,
              maxWidth: isFoldableOrTablet ? 560 : width - SPACING.lg * 2,
            },
          ]}
          pointerEvents="box-none"
        >
          <RecenterButton onPress={handleRecenter} />
        </View>

        {/* Floating Bottom Trip Information Card */}
        <TripInfoCard
          duration={currentProgress.duration}
          distance={currentProgress.distance}
          instruction={currentProgress.instruction}
          destinationTitle={DEMO_TRIP.destination.title}
          destinationAddress={DEMO_TRIP.destination.address}
          tripState={tripState}
          onStartTrip={handleStartTrip}
          onPauseTrip={handlePauseTrip}
          onFinishTrip={handleFinishTrip}
          onResetTrip={handleResetTrip}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  recenterWrapper: {
    position: 'absolute',
    right: SPACING.lg,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'flex-end',
    zIndex: 15,
  },
});

export default DriverMapScreen;
