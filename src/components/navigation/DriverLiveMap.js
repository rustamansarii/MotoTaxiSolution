import React, { useRef, useState, useEffect, useMemo } from 'react';
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
    return driverCoordinate || userCoordinate || [75.8573, 30.9005];
  }, [driverCoordinate, userCoordinate]);
  const effectiveStatus = statusLabel || driverStatus || (isOnline ? 'Online' : 'Offline');

  // Fetch real OSRM road route when pickupCoordinate or dropCoordinate is available
  useEffect(() => {
    if (!pickupCoordinate) {
      setRouteShape(null);
      return;
    }

    let isCancelled = false;
    const fetchRoute = async () => {
      try {
        const [originLng, originLat] = activeCoordinate;
        const [pLng, pLat] = pickupCoordinate;
        let osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${pLng},${pLat}?overview=full&geometries=geojson`;

        if (dropCoordinate && dropCoordinate.length === 2) {
          const [dLng, dLat] = dropCoordinate;
          osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${pLng},${pLat};${dLng},${dLat}?overview=full&geometries=geojson`;
        }

        const res = await fetch(osrmUrl);
        const data = await res.json();
        if (!isCancelled && data?.routes?.[0]?.geometry) {
          setRouteShape({
            type: 'Feature',
            properties: {},
            geometry: data.routes[0].geometry,
          });
        }
      } catch (err) {
        console.warn('[DriverLiveMap] OSRM route notice:', err);
      }
    };

    fetchRoute();
    return () => {
      isCancelled = true;
    };
  }, [activeCoordinate, pickupCoordinate, dropCoordinate]);

  // Smoothly center/fit camera when driverCoordinate or pickupCoordinate updates
  useEffect(() => {
    if (cameraRef.current && mapLoaded) {
      try {
        if (pickupCoordinate && activeCoordinate) {
          const [dLng, dLat] = activeCoordinate;
          const [pLng, pLat] = pickupCoordinate;
          const center = [(dLng + pLng) / 2, (dLat + pLat) / 2];
          cameraRef.current.flyTo({
            center,
            zoom: 13.8,
            duration: 900,
          });
        } else if (activeCoordinate) {
          cameraRef.current.flyTo({
            center: activeCoordinate,
            zoom: 15.6,
            duration: 1000,
          });
        }
      } catch (err) {
        // Safe fallback
      }
    }
  }, [activeCoordinate, pickupCoordinate, mapLoaded]);

  const handleRecenter = () => {
    if (cameraRef.current && activeCoordinate) {
      try {
        if (pickupCoordinate) {
          const [dLng, dLat] = activeCoordinate;
          const [pLng, pLat] = pickupCoordinate;
          cameraRef.current.flyTo({
            center: [(dLng + pLng) / 2, (dLat + pLat) / 2],
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
          initialViewState={{
            center: activeCoordinate,
            zoom: 15.5,
            pitch: 0,
          }}
        />

        {/* Native animated GPS Location Puck */}
        <UserLocation animated={true} />

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
                eta={effectiveStatus}
              />
            </View>
          </Marker>
        )}

        {/* Active Route Layer connecting Driver -> Pickup -> Dropoff */}
        {routeShape && (
          <RouteLayer
            id="driverActiveRoadRoute"
            route={routeShape}
            lineColor={COLORS.secondPrimary}
            lineWidth={6}
          />
        )}

        {/* Pickup Pin if active request */}
        {pickupCoordinate && pickupCoordinate.length === 2 && (
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

      {/* Floating Re-center GPS Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleRecenter}
        style={styles.recenterBtn}
      >
        <Icon name="location" size={20} color={COLORS.primary} />
      </TouchableOpacity>
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
  recenterBtn: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
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
