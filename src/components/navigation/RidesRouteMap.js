import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import {
  Map as MapLibreMap,
  Camera as MapLibreCamera,
  Marker,
} from '@maplibre/maplibre-react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import { responsiveFont } from '../../utils/responsive';
import Icon from '../Icon';
import RouteLayer from './RouteLayer';
import MapPlaceholder from '../MapPlaceholder';
import { STREET_MAP_STYLE } from './RiderLiveMap';
import { getPremappedCoordinates } from '../../utils/coordinateResolver';
import { getVehicleIconName } from '../../utils/vehicleAssets';

/**
 * Calculates optimal camera zoom based on route distance in km
 */
const getZoomForDistance = (distKm) => {
  const d = Number(distKm) || 10;
  if (d > 300) return 6.5;
  if (d > 150) return 7.5;
  if (d > 80) return 8.6;
  if (d > 40) return 9.6;
  if (d > 20) return 10.8;
  if (d > 10) return 11.8;
  if (d > 5) return 12.8;
  if (d > 2) return 13.8;
  if (d > 0.5) return 14.8;
  return 15.6;
};

/**
 * Generates an interpolated multi-point road curve fallback
 */
const generateFallbackRoute = (pickup, drop) => {
  if (!pickup || !drop || pickup.length < 2 || drop.length < 2) return null;
  const coords = [];
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lng = pickup[0] + (drop[0] - pickup[0]) * t;
    const latCurve = Math.sin(t * Math.PI) * 0.012;
    const lat = pickup[1] + (drop[1] - pickup[1]) * t + latCurve;
    coords.push([lng, lat]);
  }
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: coords,
    },
  };
};

/**
 * RidesRouteMap
 * Rock-solid MapLibre interactive map:
 * - Stable, non-reloading background map with persistent road polyline
 * - Real-time smooth driver vehicle marker updates without reloading tiles or camera
 * - Immediate fallback curve route on frame 0 (never shows blank or reloading states)
 * - Single-pass background OSRM route fetch that never cancels on driver movement
 */
const RidesRouteMapComponent = ({
  pickupCoords = [76.7834118, 30.6946309], // [longitude, latitude] Start/Pickup
  dropCoords = [75.851601, 30.9090157], // [longitude, latitude] Destination
  driverCoords = null, // [longitude, latitude] Live driver GPS position
  pickupLabel = 'Pick-up',
  destinationLabel = 'Drop-off',
  distanceKm = 92.1,
  style,
  isDriverEnRoute = false,
  isOnTrip = false,
  vehicleType = 'CAR',
  focusOnStart = false,
}) => {
  const cameraRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hasMapError, setHasMapError] = useState(false);

  const vehicleIconName = useMemo(() => {
    return getVehicleIconName(vehicleType);
  }, [vehicleType]);

  // Live driver vehicle coordinates: moves smoothly across the screen on top of the map
  const liveVehicleCoords = useMemo(() => {
    if (driverCoords && driverCoords.length === 2 && !isNaN(driverCoords[0]) && !isNaN(driverCoords[1])) {
      return [Number(driverCoords[0]), Number(driverCoords[1])];
    }
    if (pickupCoords && pickupCoords.length === 2 && !isNaN(pickupCoords[0]) && !isNaN(pickupCoords[1])) {
      return [Number(pickupCoords[0]), Number(pickupCoords[1])];
    }
    return [76.7834, 30.6948];
  }, [driverCoords, pickupCoords]);

  // Protect against false Ludhiana default when destinationLabel is another city (e.g. Shimla)
  const effectiveDropCoords = useMemo(() => {
    if (destinationLabel && typeof destinationLabel === 'string') {
      const lower = destinationLabel.toLowerCase();
      const isLudhianaDefault =
        dropCoords &&
        Math.abs(dropCoords[0] - 75.85) < 0.1 &&
        Math.abs(dropCoords[1] - 30.90) < 0.1 &&
        !lower.includes('ludhiana');

      if (isLudhianaDefault) {
        const premapped = getPremappedCoordinates(destinationLabel);
        if (premapped) {
          return premapped;
        }
      }
    }
    return dropCoords;
  }, [dropCoords, destinationLabel]);

  // Synchronously initialize route immediately on mount so road path is NEVER null!
  const [routeShape, setRouteShape] = useState(() => {
    if (pickupCoords && effectiveDropCoords && pickupCoords.length === 2 && effectiveDropCoords.length === 2) {
      return generateFallbackRoute(pickupCoords, effectiveDropCoords);
    }
    return null;
  });
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Center coordinate between pickup & dropoff
  const routeCenterCoord = useMemo(() => {
    return [
      (pickupCoords[0] + effectiveDropCoords[0]) / 2,
      (pickupCoords[1] + effectiveDropCoords[1]) / 2,
    ];
  }, [pickupCoords, effectiveDropCoords]);

  const initialZoom = useMemo(() => {
    return getZoomForDistance(distanceKm);
  }, [distanceKm]);

  // Frozen initial camera state: when focusOnStart is true, starts focused directly on vehicle / starting position
  const initialCameraState = useMemo(() => {
    if (focusOnStart) {
      return {
        center: liveVehicleCoords,
        zoom: 16.2,
        pitch: 0,
      };
    }
    return {
      center: routeCenterCoord,
      zoom: initialZoom,
      pitch: 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const routeOriginRef = useRef(pickupCoords);
  const routeDestRef = useRef(effectiveDropCoords);
  const hasFetchedOsrmRef = useRef(false);

  // Fetch turn-by-turn road route from OSRM ONCE in background.
  // Note: Only triggers if destination effectiveDropCoords changes. Driver movement alone does NOT re-trigger!
  useEffect(() => {
    if (!effectiveDropCoords || effectiveDropCoords.length < 2) return;

    const [dLng, dLat] = effectiveDropCoords;
    const prevDest = routeDestRef.current;
    const destChanged =
      !prevDest ||
      Math.abs(prevDest[0] - dLng) > 0.0003 ||
      Math.abs(prevDest[1] - dLat) > 0.0003;

    if (hasFetchedOsrmRef.current && !destChanged) {
      return;
    }

    hasFetchedOsrmRef.current = true;
    routeDestRef.current = effectiveDropCoords;

    const [origLng, origLat] = routeOriginRef.current || pickupCoords;

    // Immediately paint fallback curve while OSRM is fetching for the new destination
    setRouteShape(generateFallbackRoute([origLng, origLat], [dLng, dLat]));

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origLng},${origLat};${dLng},${dLat}?overview=full&geometries=geojson`;

    fetch(osrmUrl, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        clearTimeout(timer);
        if (data?.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates?.length > 0) {
          setRouteShape({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: data.routes[0].geometry.coordinates,
            },
          });
        }
      })
      .catch(() => {
        // Fallback curve route is already painted
      })
      .finally(() => {
        setIsLoadingRoute(false);
      });

    return () => {
      clearTimeout(timer);
    };
  }, [effectiveDropCoords, pickupCoords]);

  // Fit camera bounds to show entire route
  const handleFitRoute = useCallback(() => {
    if (!cameraRef.current) return;

    const lngDiff = Math.abs(pickupCoords[0] - effectiveDropCoords[0]);
    const latDiff = Math.abs(pickupCoords[1] - effectiveDropCoords[1]);

    if (lngDiff < 0.002 && latDiff < 0.002) {
      try {
        if (cameraRef.current.flyTo) {
          cameraRef.current.flyTo({
            center: routeCenterCoord,
            zoom: initialZoom || 15.6,
            duration: 800,
          });
          return;
        }
      } catch (_) {}
    }

    const minLng = Math.min(pickupCoords[0], effectiveDropCoords[0]);
    const maxLng = Math.max(pickupCoords[0], effectiveDropCoords[0]);
    const minLat = Math.min(pickupCoords[1], effectiveDropCoords[1]);
    const maxLat = Math.max(pickupCoords[1], effectiveDropCoords[1]);

    try {
      if (cameraRef.current.fitBounds) {
        cameraRef.current.fitBounds(
          [minLng, minLat],
          [maxLng, maxLat],
          { top: 60, bottom: 40, left: 50, right: 50 },
          1000
        );
      } else if (cameraRef.current.flyTo) {
        cameraRef.current.flyTo({
          center: routeCenterCoord,
          zoom: initialZoom,
          duration: 800,
        });
      }
    } catch (_) {}
  }, [pickupCoords, effectiveDropCoords, routeCenterCoord, initialZoom]);

  // Recenter camera directly on live vehicle / starting location
  const handleRecenterVehicle = useCallback(() => {
    if (!cameraRef.current) return;
    try {
      if (cameraRef.current.flyTo) {
        cameraRef.current.flyTo({
          center: liveVehicleCoords,
          zoom: 16.2,
          duration: 600,
        });
      }
    } catch (_) {}
  }, [liveVehicleCoords]);

  // Handle map load: if focusOnStart is true, stays centered on starting location at zoom 16.2
  const hasFittedInitialRouteRef = useRef(false);
  const handleMapLoaded = useCallback(() => {
    setMapLoaded(true);
    if (!hasFittedInitialRouteRef.current) {
      hasFittedInitialRouteRef.current = true;
      if (!focusOnStart) {
        setTimeout(() => {
          handleFitRoute();
        }, 400);
      } else {
        try {
          if (cameraRef.current?.flyTo) {
            cameraRef.current.flyTo({
              center: liveVehicleCoords,
              zoom: 16.2,
              duration: 350,
            });
          }
        } catch (_) {}
      }
    }
  }, [focusOnStart, handleFitRoute, liveVehicleCoords]);

  // Clean, short label extraction
  const cleanPickup = useMemo(() => {
    const raw = typeof pickupLabel === 'string' ? pickupLabel : (pickupLabel?.address || pickupLabel?.name || '');
    if (!raw) return isDriverEnRoute ? 'Driver' : 'Pick-up';
    const first = raw.split(',')[0].trim();
    return first.length > 18 ? `${first.substring(0, 16)}...` : first;
  }, [pickupLabel, isDriverEnRoute]);

  const cleanDrop = useMemo(() => {
    const raw = typeof destinationLabel === 'string' ? destinationLabel : (destinationLabel?.address || destinationLabel?.name || '');
    if (!raw) return isDriverEnRoute ? 'Rider (Pickup)' : 'Drop-off';
    const hasPickupSuffix = raw.toLowerCase().includes('(pickup)');
    const base = raw.replace(/\s*\(pickup\)/gi, '').split(',')[0].trim();
    if (hasPickupSuffix || isDriverEnRoute) {
      if (!base || base.toLowerCase() === 'rider') return 'Rider (Pickup)';
      if (base.toLowerCase() === 'pickup' || base.toLowerCase() === 'pick-up') return 'Pickup';
      const shortBase = base.length > 13 ? `${base.substring(0, 11)}...` : base;
      return `${shortBase} (Pickup)`;
    }
    return base.length > 18 ? `${base.substring(0, 16)}...` : base;
  }, [destinationLabel, isDriverEnRoute]);

  // Graceful fallback to MapPlaceholder if native map fails
  if (hasMapError) {
    return (
      <View style={[styles.container, style]}>
        <MapPlaceholder
          showRoute={true}
          showPickupMarker={true}
          showDestinationMarker={true}
          showDriverMarker={false}
          pickupLabel={pickupLabel}
          destinationLabel={destinationLabel}
          height="100%"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <MapLibreMap
        style={StyleSheet.absoluteFillObject}
        mapStyle={STREET_MAP_STYLE}
        compassEnabled={false}
        logoPosition={{ bottom: 12, left: 12 }}
        attributionPosition={{ bottom: 12, right: 12 }}
        onDidFinishLoadingMap={handleMapLoaded}
        onError={(e) => {
          console.warn('[RidesRouteMap] Map error, using fallback:', e);
          setHasMapError(true);
        }}
      >
        <MapLibreCamera
          ref={cameraRef}
          initialViewState={initialCameraState}
        />

        {/* Stable Road Route Layer in background */}
        {routeShape && (
          <RouteLayer
            id="activeRideRoadRoute"
            route={routeShape}
            lineColor={COLORS.secondPrimary}
            lineWidth={6}
          />
        )}

        {/* Pickup Marker: visible if static route or if trip is in progress */}
        {(!isDriverEnRoute || isOnTrip) && pickupCoords && pickupCoords.length === 2 && (
          <Marker
            id="pickupLocationPin"
            lngLat={pickupCoords}
            coordinate={pickupCoords}
            anchor="bottom"
          >
            <View style={styles.markerContainer}>
              <View style={styles.pickupPill}>
                <View style={styles.pickupPillDot} />
                <Text numberOfLines={1} style={styles.pickupPillText}>
                  {cleanPickup}
                </Text>
              </View>
              <View style={styles.pickupPinCircle}>
                <View style={styles.pickupPinInnerDot} />
              </View>
              <View style={styles.pickupPinTip} />
            </View>
          </Marker>
        )}

        {/* Live Vehicle Marker: Smooth real-time coordinate tracking with dynamic vehicle icon */}
        {(isDriverEnRoute || isOnTrip) && liveVehicleCoords && liveVehicleCoords.length === 2 && (
          <Marker
            id="driverLiveVehiclePin"
            lngLat={liveVehicleCoords}
            coordinate={liveVehicleCoords}
            anchor="center"
          >
            <View style={styles.markerContainer}>
              <View style={styles.pickupPill}>
                <Icon
                  name={vehicleIconName}
                  size={12}
                  color={COLORS.primary || '#00A86B'}
                  style={{ marginRight: 4 }}
                />
                <Text numberOfLines={1} style={styles.pickupPillText}>
                  {isOnTrip ? (vehicleType ? String(vehicleType).toUpperCase() : 'DRIVER') : cleanPickup}
                </Text>
              </View>
              <View style={styles.driverPinCircle}>
                <Icon
                  name={vehicleIconName}
                  size={15}
                  color={COLORS.white}
                />
              </View>
              <View style={styles.driverPinTip} />
            </View>
          </Marker>
        )}

        {/* Destination / Dropoff Pin Marker */}
        {effectiveDropCoords && effectiveDropCoords.length === 2 && (
          <Marker
            id="dropLocationPin"
            lngLat={effectiveDropCoords}
            coordinate={effectiveDropCoords}
            anchor="bottom"
          >
            <View style={styles.markerContainer}>
              <View style={styles.dropPill}>
                {isDriverEnRoute && !isOnTrip && <View style={styles.pickupPillDot} />}
                <Text numberOfLines={1} style={styles.dropPillText}>
                  {cleanDrop}
                </Text>
              </View>
              {isDriverEnRoute && !isOnTrip ? (
                <>
                  <View style={styles.pickupPinCircle}>
                    <View style={styles.pickupPinInnerDot} />
                  </View>
                  <View style={styles.pickupPinTip} />
                </>
              ) : (
                <>
                  <View style={styles.dropPinCircle}>
                    <Icon name="flag" size={12} color={COLORS.white} />
                  </View>
                  <View style={styles.dropPinTip} />
                </>
              )}
            </View>
          </Marker>
        )}
      </MapLibreMap>

      {/* Route Loading Badge (only shown before initial route exists) */}
      {isLoadingRoute && !routeShape && (
        <View style={styles.routeLoadingBadge}>
          <ActivityIndicator size="small" color={COLORS.secondPrimary} style={{ marginRight: 6 }} />
          <Text style={styles.routeLoadingText}>Drawing road path...</Text>
        </View>
      )}

      {/* Floating Map Controls: Recenter on Vehicle + View Full Route */}
      <View style={styles.mapControlsContainer}>
        {/* Fit Entire Route Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleFitRoute}
          style={styles.mapControlBtn}
          accessibilityLabel="View full route overview"
        >
          <Icon name="map" size={17} color={COLORS.primary || '#0F172A'} />
        </TouchableOpacity>

        {/* Recenter on Vehicle / Starting Location Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleRecenterVehicle}
          style={[styles.mapControlBtn, styles.recenterBtn]}
          accessibilityLabel="Recenter on starting location"
        >
          <Icon name="navigation" size={16} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.round,
    marginBottom: 4,
    maxWidth: 130,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  pickupPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 4,
  },
  pickupPillText: {
    fontSize: responsiveFont(11),
    fontWeight: '700',
    color: '#0F172A',
  },
  pickupPinCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  pickupPinInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
  },
  pickupPinTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.primary,
    alignSelf: 'center',
  },
  dropPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.round,
    marginBottom: 4,
    maxWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  dropPillText: {
    fontSize: responsiveFont(11),
    fontWeight: '700',
    color: COLORS.white,
  },
  dropPinCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  dropPinTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#0F172A',
    alignSelf: 'center',
  },
  driverPinCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.secondPrimary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  driverPinTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#0F172A',
    alignSelf: 'center',
  },
  mapControlsContainer: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    flexDirection: 'column',
    alignItems: 'center',
  },
  mapControlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  recenterBtn: {
    backgroundColor: COLORS.primary || '#0F172A',
    borderColor: 'transparent',
    marginBottom: 0,
  },
  routeLoadingBadge: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  routeLoadingText: {
    fontSize: responsiveFont(11),
    fontWeight: '600',
    color: COLORS.secondPrimary,
  },
});

const areCoordinatesClose = (a, b) => {
  if (a === b) return true;
  if (!a || !b) return false;
  return Math.abs(a[0] - b[0]) < 0.00003 && Math.abs(a[1] - b[1]) < 0.00003;
};

export const RidesRouteMap = React.memo(
  RidesRouteMapComponent,
  (prevProps, nextProps) => {
    // If live vehicle coordinates moved meaningfully (> ~3m), re-render so Marker moves
    if (!areCoordinatesClose(prevProps.driverCoords, nextProps.driverCoords)) {
      return false; // re-render
    }
    // If route pickup or drop coordinates changed
    if (!areCoordinatesClose(prevProps.pickupCoords, nextProps.pickupCoords)) {
      return false; // re-render
    }
    if (!areCoordinatesClose(prevProps.dropCoords, nextProps.dropCoords)) {
      return false; // re-render
    }
    // If labels, mode, vehicle type, or focusOnStart changed
    if (
      prevProps.pickupLabel !== nextProps.pickupLabel ||
      prevProps.destinationLabel !== nextProps.destinationLabel ||
      prevProps.vehicleType !== nextProps.vehicleType ||
      prevProps.isDriverEnRoute !== nextProps.isDriverEnRoute ||
      prevProps.isOnTrip !== nextProps.isOnTrip ||
      prevProps.focusOnStart !== nextProps.focusOnStart
    ) {
      return false; // re-render
    }
    // Micro-changes in distance or re-created array instances do NOT reload the map!
    return true; // skip re-render
  }
);

export default RidesRouteMap;
