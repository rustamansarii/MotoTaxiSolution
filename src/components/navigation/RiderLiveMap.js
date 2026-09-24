import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import {
  Map as MapLibreMap,
  Camera as MapLibreCamera,
  Marker,
  UserLocation,
} from '@maplibre/maplibre-react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import Icon from '../Icon';
import DriverMarker from './DriverMarker';
import MapPlaceholder from '../MapPlaceholder';

// High-resolution, full-detail street map style from OpenStreetMap
// 100% Free, Open-Source, NO API key required, NO watermark
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

export const RiderLiveMap = ({
  userCoordinate = [75.8573, 30.9005], // [longitude, latitude]
  nearbyDrivers = [],
  pickupLabel = 'My Location',
  onRecenter,
  style,
}) => {
  const cameraRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Smoothly center camera when userCoordinate updates
  useEffect(() => {
    if (cameraRef.current && userCoordinate && mapLoaded) {
      try {
        if (cameraRef.current.flyTo) {
          cameraRef.current.flyTo({
            center: userCoordinate,
            zoom: 15.5,
            duration: 1000,
          });
        }
      } catch (err) {
        // Safe fallback
      }
    }
  }, [userCoordinate, mapLoaded]);

  const handleRecenter = () => {
    if (cameraRef.current && userCoordinate) {
      try {
        if (cameraRef.current.flyTo) {
          cameraRef.current.flyTo({
            center: userCoordinate,
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
          showPickupMarker={true}
          showDestinationMarker={false}
          showDriverMarker={true}
          pickupLabel={pickupLabel}
          driverEta="3 min"
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
          console.warn('[MapLibre] Tile error, switching to fallback:', e);
          setHasError(true);
        }}
      >
        <MapLibreCamera
          ref={cameraRef}
          initialViewState={{
            center: userCoordinate,
            zoom: 15,
            pitch: 0,
          }}
        />

        {/* Native animated GPS Location Puck */}
        <UserLocation animated={true} />

        {/* Custom User GPS Marker Pin */}
        {userCoordinate && userCoordinate.length === 2 && (
          <Marker
            id="userCurrentLocationPin"
            lngLat={userCoordinate}
            coordinate={userCoordinate}
            anchor="center"
          >
            <View style={styles.userMarkerContainer}>
              <View style={styles.userHalo} />
              <View style={styles.userDot}>
                <View style={styles.userInnerDot} />
              </View>
              {pickupLabel ? (
                <View style={styles.pickupPill}>
                  <Text style={styles.pickupPillText} numberOfLines={1}>
                    {pickupLabel}
                  </Text>
                </View>
              ) : null}
            </View>
          </Marker>
        )}

        {/* Nearby Drivers on Map */}
        {nearbyDrivers.map((driver) => (
          <Marker
            key={driver.id || `driver_${driver.coordinate[0]}`}
            id={`driver_${driver.id}`}
            lngLat={driver.coordinate}
            coordinate={driver.coordinate}
            anchor="center"
          >
            <DriverMarker
              heading={driver.heading || 0}
              eta={driver.eta || '3 min'}
            />
          </Marker>
        ))}
      </MapLibreMap>

      {/* Floating Re-center GPS Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleRecenter}
        style={styles.recenterBtn}
      >
        <Icon name="crosshairs" size={20} color={COLORS.primary} />
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
  userMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
  },
  userHalo: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(23, 186, 161, 0.25)',
  },
  userDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  userInnerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
  },
  pickupPill: {
    position: 'absolute',
    bottom: -18,
    backgroundColor: COLORS.text,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.round,
  },
  pickupPillText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
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
});

export default RiderLiveMap;
