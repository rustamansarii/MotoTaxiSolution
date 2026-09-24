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
import Icon from '../Icon';
import RouteLayer from './RouteLayer';
import MapPlaceholder from '../MapPlaceholder';
import { STREET_MAP_STYLE } from './RiderLiveMap';

/**
 * Calculates optimal camera zoom based on route distance in km
 */
const getZoomForDistance = (distKm) => {
  const d = Number(distKm) || 10;
  if (d > 300) return 6.5;
  if (d > 150) return 7.5;
  if (d > 80) return 8.6; // ~92 km (Chandigarh to Ludhiana)
  if (d > 40) return 9.6;
  if (d > 20) return 10.8;
  if (d > 10) return 11.8;
  if (d > 5) return 12.8;
  if (d > 2) return 13.8;
  return 14.8;
};

/**
 * Generates an interpolated multi-point road curve fallback
 */
const generateFallbackRoute = (pickup, drop) => {
  const coords = [];
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lng = pickup[0] + (drop[0] - pickup[0]) * t;
    const latCurve = Math.sin(t * Math.PI) * 0.015;
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
 * Clean, modern MapLibre interactive map showing:
 * - High-res OpenStreetMap street tiles (free, no API key)
 * - Active road route connecting pickup and dropoff
 * - Minimal, elegant pickup and dropoff markers
 * - Floating thumb-friendly recenter control
 */
export const RidesRouteMap = ({
  pickupCoords = [76.7834118, 30.6946309], // [longitude, latitude]
  dropCoords = [75.851601, 30.9090157], // [longitude, latitude]
  pickupLabel = 'Pick-up',
  destinationLabel = 'Drop-off',
  distanceKm = 92.1,
  style,
}) => {
  const cameraRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hasMapError, setHasMapError] = useState(false);
  const [routeShape, setRouteShape] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);

  // Center coordinate between pickup & dropoff
  const centerCoord = useMemo(() => {
    return [
      (pickupCoords[0] + dropCoords[0]) / 2,
      (pickupCoords[1] + dropCoords[1]) / 2,
    ];
  }, [pickupCoords, dropCoords]);

  const initialZoom = useMemo(() => {
    return getZoomForDistance(distanceKm);
  }, [distanceKm]);

  // Fetch real road route from OSRM
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingRoute(true);

    const fetchRoute = async () => {
      try {
        const [pLng, pLat] = pickupCoords;
        const [dLng, dLat] = dropCoords;
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pLng},${pLat};${dLng},${dLat}?overview=full&geometries=geojson`;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(osrmUrl, { signal: controller.signal });
        clearTimeout(timer);

        const data = await res.json();
        if (
          !isCancelled &&
          data?.code === 'Ok' &&
          data.routes?.[0]?.geometry?.coordinates?.length > 0
        ) {
          setRouteShape({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: data.routes[0].geometry.coordinates,
            },
          });
          setIsLoadingRoute(false);
          return;
        }
      } catch (err) {
        // Fallback below
      }

      if (!isCancelled) {
        setRouteShape(generateFallbackRoute(pickupCoords, dropCoords));
        setIsLoadingRoute(false);
      }
    };

    fetchRoute();

    return () => {
      isCancelled = true;
    };
  }, [pickupCoords, dropCoords]);

  // Fit camera bounds to show entire route
  const handleFitRoute = useCallback(() => {
    if (!cameraRef.current) return;

    const minLng = Math.min(pickupCoords[0], dropCoords[0]);
    const maxLng = Math.max(pickupCoords[0], dropCoords[0]);
    const minLat = Math.min(pickupCoords[1], dropCoords[1]);
    const maxLat = Math.max(pickupCoords[1], dropCoords[1]);

    try {
      if (cameraRef.current.fitBounds) {
        cameraRef.current.fitBounds(
          [minLng, minLat],
          [maxLng, maxLat],
          { top: 60, bottom: 40, left: 50, right: 50 },
          1000
        );
      } else if (cameraRef.current.setStop) {
        cameraRef.current.setStop({
          bounds: {
            ne: [maxLng, maxLat],
            sw: [minLng, minLat],
            paddingLeft: 50,
            paddingRight: 50,
            paddingTop: 60,
            paddingBottom: 40,
          },
          duration: 1000,
        });
      }
    } catch (e) {
      try {
        if (cameraRef.current.flyTo) {
          cameraRef.current.flyTo({
            center: centerCoord,
            zoom: initialZoom,
            duration: 800,
          });
        }
      } catch (_) {}
    }
  }, [pickupCoords, dropCoords, centerCoord, initialZoom]);

  // Re-fit when map finishes loading
  const handleMapLoaded = useCallback(() => {
    setMapLoaded(true);
    setTimeout(() => {
      handleFitRoute();
    }, 400);
  }, [handleFitRoute]);

  // Clean, short label extraction
  const cleanPickup = useMemo(() => {
    if (!pickupLabel) return 'Pick-up';
    const first = pickupLabel.split(',')[0].trim();
    return first.length > 18 ? `${first.substring(0, 16)}...` : first;
  }, [pickupLabel]);

  const cleanDrop = useMemo(() => {
    if (!destinationLabel) return 'Drop-off';
    const first = destinationLabel.split(',')[0].trim();
    return first.length > 18 ? `${first.substring(0, 16)}...` : first;
  }, [destinationLabel]);

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
          initialViewState={{
            center: centerCoord,
            zoom: initialZoom,
            pitch: 0,
          }}
        />

        {/* Active Road Route Layer */}
        {routeShape && (
          <RouteLayer
            id="activeRideRoadRoute"
            route={routeShape}
            lineColor={COLORS.secondPrimary}
            lineWidth={6}
          />
        )}

        {/* Pickup Pin Marker */}
        {pickupCoords && pickupCoords.length === 2 && (
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

        {/* Destination / Drop Pin Marker */}
        {dropCoords && dropCoords.length === 2 && (
          <Marker
            id="dropLocationPin"
            lngLat={dropCoords}
            coordinate={dropCoords}
            anchor="bottom"
          >
            <View style={styles.markerContainer}>
              <View style={styles.dropPill}>
                <Text numberOfLines={1} style={styles.dropPillText}>
                  {cleanDrop}
                </Text>
              </View>
              <View style={styles.dropPinCircle}>
                <Icon name="flag" size={12} color={COLORS.white} />
              </View>
              <View style={styles.dropPinTip} />
            </View>
          </Marker>
        )}
      </MapLibreMap>

      {/* Route Loading Badge (compact top chip) */}
      {isLoadingRoute && (
        <View style={styles.routeLoadingBadge}>
          <ActivityIndicator size="small" color={COLORS.secondPrimary} style={{ marginRight: 6 }} />
          <Text style={styles.routeLoadingText}>Drawing road path...</Text>
        </View>
      )}

      {/* Recenter / Fit Full Route Control (bottom-right thumb friendly) */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleFitRoute}
        style={styles.fitRouteBtn}
      >
        <Icon name="navigation" size={17} color={COLORS.primary} />
      </TouchableOpacity>
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
    fontSize: 11,
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
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.round,
    marginBottom: 4,
    maxWidth: 130,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  dropPillText: {
    fontSize: 11,
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
  fitRouteBtn: {
    position: 'absolute',
    right: 14,
    bottom: 14,
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
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.secondPrimary,
  },
});

export default RidesRouteMap;
