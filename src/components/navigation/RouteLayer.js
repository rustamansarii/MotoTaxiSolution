import React from 'react';
import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import { COLORS } from '../../theme/colors';

/**
 * RouteLayer renders the static navigation path using MapLibre GeoJSONSource and Layer (line).
 * Color matches COLORS.secondPrimary per design system.
 */
export const RouteLayer = ({
  id = 'demoRoute',
  route,
  lineColor = COLORS.secondPrimary,
  lineWidth = 6,
}) => {
  if (!route) return null;

  return (
    <GeoJSONSource id={`${id}Source`} data={route}>
      {/* Route background casing for contrast */}
      <Layer
        id={`${id}Casing`}
        type="line"
        paint={{
          'line-color': '#1E293B',
          'line-width': lineWidth + 3,
          'line-opacity': 0.35,
          'line-cap': 'round',
          'line-join': 'round',
        }}
      />
      {/* Primary active navigation route */}
      <Layer
        id={`${id}Line`}
        type="line"
        paint={{
          'line-color': lineColor,
          'line-width': lineWidth,
          'line-cap': 'round',
          'line-join': 'round',
        }}
      />
    </GeoJSONSource>
  );
};

export default RouteLayer;
