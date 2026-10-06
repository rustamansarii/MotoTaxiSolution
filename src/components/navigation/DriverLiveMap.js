import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import {
  Map as MapLibreMap,
  Camera as MapLibreCamera,
  Marker,
  UserLocation,
} from '@maplibre/maplibre-react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Icon from '../Icon';
import DriverMarker from './DriverMarker';
import RouteLayer from './RouteLayer';
import MapPlaceholder from '../MapPlaceholder';

// High-resolution, full-detail street map style from OpenStreetMap
export const STREET_MAP_STYLE = JSON.stringify({
  version: 8,
  sources: {
    'osm-street-tiles': {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-street-tiles-layer',
      type: 'raster',
      source: 'osm-street-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
});

export const DriverLiveMap = ({
  driverCoordinate = [75.8573, 30.9005], // [longitude, latitude]
  userCoordinate, // fallback alias
  driverHeading = 0,
  driverStatus = 'Online',
  isOnline = true,
  statusLabel,
  target = null, // 'pickup' | 'drop'
  pickupCoordinate = null,
  dropCoordinate = null,
  pickupLabel = 'Pickup',
  destinationLabel = 'Drop-off',
  nearbyRequests = [],
  onRequestPress,
  onRecenter,
  style,
}) => {
  const cameraRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [routeShape, setRouteShape] = useState(null);

  const activeCoordinate = useMemo(() => {
    const raw = driverCoordinate || userCoordinate || [75.8573, 30.9005];
    return [Number(raw[0]), Number(raw[1])];
  }, [driverCoordinate, userCoordinate]);

  // Frozen initial camera state: guarantees MapLibre camera doesn't reset or flash on GPS updates
  const initialCameraState = useMemo(() => {
    return {
      center: activeCoordinate,
      zoom: 15.5,
      pitch: 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const effectiveStatus = statusLabel || driverStatus || (isOnline ? 'Online' : 'Offline');

  // Active destination based on target:
  // If target === 'drop' (ON_TRIP): route driver directly to dropCoordinate
  // If target === 'pickup': route driver to pickupCoordinate
  const activeDestination = useMemo(() => {
    if (target === 'drop') {
      return dropCoordinate || pickupCoordinate;
    }
    if (target === 'pickup') {
      return pickupCoordinate;
    }
    return dropCoordinate || pickupCoordinate;
  }, [target, dropCoordinate, pickupCoordinate]);

  // Generates an immediate curved route line so a path is always visible
  const generateFallbackRoute = useCallback((start, end) => {
    if (!start || !end || start.length < 2 || end.length < 2) return null;
    const coords = [];
    const steps = 14;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lng = start[0] + (end[0] - start[0]) * t;
      const latCurve = Math.sin(t * Math.PI) * 0.003;
      const lat = start[1] + (end[1] - start[1]) * t + latCurve;
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
  }, []);

  const lastRouteParamsRef = useRef({
    originLng: null,
    originLat: null,
    destLng: null,
    destLat: null,
    lastFetchedAt: 0,
  });

  // Stable OSRM Route Fetching: once route is set, keep it stable in background!
  useEffect(() => {
    if (!activeDestination || activeDestination.length < 2) {
      setRouteShape(null);
      return;
    }

    const [origLng, origLat] = activeCoordinate;
    const [destLng, destLat] = activeDestination;

    const prev = lastRouteParamsRef.current;
    const destChanged =
      prev.destLng === null ||
      Math.abs(prev.destLng - destLng) > 0.0003 ||
      Math.abs(prev.destLat - destLat) > 0.0003;

    // If route already exists and destination didn't change, KEEP the route stable in background!
    // Driver GPS movements should NOT invalidate the route path or trigger map reloading.
    if (routeShape && !destChanged) {
      return;
    }

    lastRouteParamsRef.current = {
      originLng: origLng,
      originLat: origLat,
      destLng: destLng,
      destLat: destLat,
      lastFetchedAt: Date.now(),
    };

    let isCancelled = false;
    const fetchRoute = async () => {
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origLng},${origLat};${destLng},${destLat}?overview=full&geometries=geojson`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(osrmUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        const data = await res.json();
        if (
          !isCancelled &&
          data?.code === 'Ok' &&
          data.routes?.[0]?.geometry?.coordinates?.length > 0
        ) {
          setRouteShape({
            type: 'Feature',
            properties: {},
            geometry: data.routes[0].geometry,
          });
          return;
        }
      } catch (err) {
        // Non-fatal network notice
      }

      if (!isCancelled) {
        setRouteShape((prev) => prev || generateFallbackRoute(activeCoordinate, activeDestination));
      }
    };

    fetchRoute();

    return () => {
      isCancelled = true;
    };
  }, [activeCoordinate, activeDestination, generateFallbackRoute, routeShape]);

  // Initial and destination-change camera fit (does NOT run on every raw coordinate tick)
  const hasInitializedCameraRef = useRef(false);
  const lastTargetRef = useRef(null);
  useEffect(() => {
    if (cameraRef.current && mapLoaded && activeCoordinate) {
      const targetChanged = target && target !== lastTargetRef.current;
      if (activeDestination && (!hasInitializedCameraRef.current || targetChanged)) {
        hasInitializedCameraRef.current = true;
        lastTargetRef.current = target;
        const [dLng, dLat] = activeCoordinate;
        const [tLng, tLat] = activeDestination;
        const center = [(dLng + tLng) / 2, (dLat + tLat) / 2];
        try {
          cameraRef.current.flyTo({
            center,
            zoom: 13.8,
            duration: 800,
          });
        } catch (e) {}
      } else if (!hasInitializedCameraRef.current) {
        hasInitializedCameraRef.current = true;
        try {
          cameraRef.current.flyTo({
            center: activeCoordinate,
            zoom: 15.6,
            duration: 800,
          });
        } catch (e) {}
      }
    }
  }, [mapLoaded, activeDestination, target]);

  const handleRecenter = () => {
    if (cameraRef.current && activeCoordinate) {
      try {
        if (activeDestination) {
          const [dLng, dLat] = activeCoordinate;
          const [tLng, tLat] = activeDestination;
          cameraRef.current.flyTo({
            center: [(dLng + tLng) / 2, (dLat + tLat) / 2],
            zoom: 14.0,
            duration: 800,
          });
        } else {
          cameraRef.current.flyTo({
            center: activeCoordinate,
            zoom: 15.8,
            duration: 800,
          });
        }
      } catch (err) {
        // Fallback
      }
    }
    if (onRecenter) onRecenter();
  };

  if (hasError) {
    return (
      <View style={[styles.container, style]}>
        <MapPlaceholder
          showRoute={false}
          showPickupMarker={false}
          showDestinationMarker={false}
          showDriverMarker={true}
          isDriverMode={true}
          pickupLabel={effectiveStatus}
          driverEta={effectiveStatus}
          height="100%"
          onRecenter={handleRecenter}
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
        logoPosition={{ bottom: 20, left: 16 }}
        attributionPosition={{ bottom: 20, right: 16 }}
        onDidFinishLoadingMap={() => setMapLoaded(true)}
        onError={(e) => {
          if (e?.fatal) {
            setHasError(true);
          } else {
            console.warn('[DriverLiveMap] Tile notice (non-fatal):', e);
          }
        }}
      >
        <MapLibreCamera
          ref={cameraRef}
          initialViewState={initialCameraState}
        />

        {/* Driver Center Vehicle Marker */}
        {activeCoordinate && activeCoordinate.length === 2 && (
          <Marker
            id="driverVehicleMarker"
            lngLat={activeCoordinate}
            coordinate={activeCoordinate}
            anchor="center"
          >
            <View style={styles.driverMarkerWrapper}>
              <DriverMarker
                heading={driverHeading}
                eta={activeDestination ? effectiveStatus : (statusLabel || 'You are here')}
              />
            </View>
          </Marker>
        )}

        {/* Active Route Layer connecting Driver to Destination */}
        {routeShape && (
          <RouteLayer
            id="driverActiveRoadRoute"
            route={routeShape}
            lineColor={COLORS.secondPrimary}
            lineWidth={6}
          />
        )}

        {/* Pickup Pin (only shown when heading to pickup, hidden once ON_TRIP) */}
        {target !== 'drop' && pickupCoordinate && pickupCoordinate.length === 2 && (
          <Marker
            id="driverLivePickupMarker"
            lngLat={pickupCoordinate}
            coordinate={pickupCoordinate}
            anchor="bottom"
          >
            <View style={styles.pinWrapper}>
              <View style={styles.pickupPill}>
                <View style={styles.pickupDotIcon} />
                <Text style={styles.pickupPillText} numberOfLines={1}>
                  {pickupLabel || 'Pickup'}
                </Text>
              </View>
              <View style={styles.pinStem} />
            </View>
          </Marker>
        )}

        {/* Dropoff Pin if active request */}
        {dropCoordinate && dropCoordinate.length === 2 && (
          <Marker
            id="driverLiveDropMarker"
            lngLat={dropCoordinate}
            coordinate={dropCoordinate}
            anchor="bottom"
          >
            <View style={styles.pinWrapper}>
              <View style={styles.dropPill}>
                <View style={styles.dropSquareIcon} />
                <Text style={styles.dropPillText} numberOfLines={1}>
                  {destinationLabel || 'Dropoff'}
                </Text>
              </View>
              <View style={styles.pinStem} />
            </View>
          </Marker>
        )}

        {/* Nearby Ride Requests / Passenger Hotspots */}
        {isOnline &&
          nearbyRequests.map((req) => (
            <Marker
              key={req.id || `req_${req.coordinate[0]}`}
              id={`req_${req.id}`}
              lngLat={req.coordinate}
              coordinate={req.coordinate}
              anchor="center"
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => onRequestPress && onRequestPress(req)}
                style={styles.requestPin}
              >
                <View style={styles.requestPinBadge}>
                  <Icon name="user" size={12} color={COLORS.white} />
                  <Text style={styles.requestPinFare}>{req.fare || '$18.50'}</Text>
                </View>
                <View style={styles.requestPinPulse} />
              </TouchableOpacity>
            </Marker>
          ))}
      </MapLibreMap>

      {/* Floating Map Controls (Crosshairs Recenter + Direction Navigation) */}
      <View style={styles.mapControlsCol}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleRecenter}
          style={styles.mapControlBtn}
        >
          <Icon name="my-location" size={20} color="#334155" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleRecenter}
          style={styles.mapControlBtn}
        >
          <Icon name="navigation" size={20} color="#059669" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#E8ECF2',
    position: 'relative',
  },
  driverMarkerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestPin: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestPinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondPrimary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
    borderWidth: 1.5,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    gap: 4,
    zIndex: 2,
  },
  requestPinFare: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.white,
  },
  requestPinPulse: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(65, 84, 254, 0.22)',
  },
  mapControlsCol: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    gap: 12,
    zIndex: 10,
  },
  mapControlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pinWrapper: {
    alignItems: 'center',
  },
  pickupPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  pickupDotIcon: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
    marginRight: 4,
  },
  pickupPillText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
    maxWidth: 100,
  },
  dropPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondPrimary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  dropSquareIcon: {
    width: 6,
    height: 6,
    borderRadius: 1,
    backgroundColor: COLORS.white,
    marginRight: 4,
  },
  dropPillText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
    maxWidth: 100,
  },
  pinStem: {
    width: 2,
    height: 6,
    backgroundColor: '#334155',
  },
});

export default DriverLiveMap;
