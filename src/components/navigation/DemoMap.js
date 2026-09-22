import React, { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import {
  Map as MapLibreMap,
  Camera as MapLibreCamera,
  GeoJSONSource,
  Layer,
  Marker,
} from '@maplibre/maplibre-react-native';
import { COLORS } from '../../theme/colors';
import { DEMO_MAP_STYLE } from '../../data/mockNavigationData';
import RouteLayer from './RouteLayer';
import DriverMarker from './DriverMarker';
import DestinationMarker from './DestinationMarker';

/**
 * Convenience aliases for backwards compatibility with v10 and prompt requirements
 */
export const MapView = MapLibreMap;
export const Camera = MapLibreCamera;
export const ShapeSource = GeoJSONSource;
export const LineLayer = (props) => <Layer type="line" {...props} />;
export const MarkerView = Marker;

/**
 * DemoMap
 * Core MapLibre map component rendering the interactive vector map,
 * Camera viewport, GeoJSON route, animated driver marker, and destination pin.
 */
export const DemoMap = forwardRef(
  (
    {
      driverCoordinate, // [longitude, latitude]
      driverHeading = 45,
      driverEta = '12 min',
      destinationCoordinate, // [longitude, latitude]
      destinationTitle = 'Destination',
      destinationAddress = '123 Main Street',
      routeShape,
      mapStyle = DEMO_MAP_STYLE,
      onMapLoaded,
      style,
    },
    ref
  ) => {
    const cameraRef = useRef(null);
    const [hasNativeMapError, setHasNativeMapError] = useState(false);

    // Initial camera centered between driver and destination
    const initialCenter = [
      (driverCoordinate[0] + destinationCoordinate[0]) / 2,
      (driverCoordinate[1] + destinationCoordinate[1]) / 2,
    ];

    useImperativeHandle(ref, () => ({
      /**
       * Smoothly fly or ease camera to coordinates
       */
      recenter: (coord = driverCoordinate, zoom = 15) => {
        try {
          if (cameraRef.current?.flyTo) {
            cameraRef.current.flyTo({
              center: coord,
              zoom,
              duration: 1000,
            });
          } else if (cameraRef.current?.setStop) {
            cameraRef.current.setStop({
              center: coord,
              zoom,
              duration: 1000,
            });
          }
        } catch (e) {
          // fallback if camera not yet attached
        }
      },

      /**
       * Fit full route inside viewport
       */
      fitRoute: () => {
        try {
          if (cameraRef.current?.fitBounds) {
            cameraRef.current.fitBounds(
              [
                [75.8570, 30.9000], // SW
                [75.8700, 30.9110], // NE
              ],
              { duration: 1200, padding: { top: 120, bottom: 260, left: 40, right: 40 } }
            );
          }
        } catch (e) {
          // fallback
        }
      },
    }));

    return (
      <View style={[styles.container, style]}>
        {!hasNativeMapError ? (
          <MapLibreMap
            style={StyleSheet.absoluteFillObject}
            mapStyle={mapStyle}
            compassEnabled={false}
            logoPosition={{ bottom: 280, left: 16 }}
            attributionPosition={{ bottom: 280, right: 16 }}
            onDidFinishLoadingMap={onMapLoaded}
            onError={() => {
              // Graceful error handling if offline
            }}
          >
            {/* Map Camera */}
            <MapLibreCamera
              ref={cameraRef}
              initialViewState={{
                center: initialCenter,
                zoom: 14.2,
                pitch: 35,
              }}
            />

            {/* Static GeoJSON Navigation Route */}
            {routeShape && (
              <RouteLayer id="demoTripRoute" route={routeShape} lineWidth={6} />
            )}

            {/* Destination Marker */}
            {destinationCoordinate && (
              <Marker
                id="demoDestMarker"
                coordinate={destinationCoordinate}
                anchor="bottom"
              >
                <DestinationMarker
                  title={destinationTitle}
                  address={destinationAddress}
                />
              </Marker>
            )}

            {/* Driver Vehicle Marker */}
            {driverCoordinate && (
              <Marker
                id="demoDriverMarker"
                coordinate={driverCoordinate}
                anchor="center"
              >
                <DriverMarker
                  heading={driverHeading}
                  eta={driverEta}
                />
              </Marker>
            )}
          </MapLibreMap>
        ) : (
          <View style={styles.fallbackCanvas}>
            <Text style={styles.fallbackText}>MapLibre Map View</Text>
          </View>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E2E8F0',
  },
  fallbackCanvas: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
  },
  fallbackText: {
    color: COLORS.textLight,
    fontWeight: '600',
  },
});

export default DemoMap;
