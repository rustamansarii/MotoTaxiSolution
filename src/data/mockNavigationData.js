/**
 * Static mock data for MapLibre demo navigation.
 * All coordinates, distances, and durations are purely static for UI demo purposes.
 * NO real GPS or external routing APIs are used.
 */

export const DEMO_TRIP = {
  driver: {
    latitude: 30.9005,
    longitude: 75.8573,
    heading: 45,
  },

  pickup: {
    latitude: 30.9035,
    longitude: 75.8615,
    title: 'Pickup Location',
  },

  destination: {
    latitude: 30.9105,
    longitude: 75.8695,
    title: 'Destination',
    address: '123 Main Street',
  },

  distance: '4.8 km',
  duration: '12 min',

  route: {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [
        [75.8573, 30.9005],
        [75.8585, 30.9015],
        [75.8600, 30.9025],
        [75.8615, 30.9040],
        [75.8630, 30.9055],
        [75.8645, 30.9070],
        [75.8660, 30.9085],
        [75.8695, 30.9105],
      ],
    },
  },
};

export const DEMO_DRIVER_PATH = [
  [75.8573, 30.9005],
  [75.8585, 30.9015],
  [75.8600, 30.9025],
  [75.8615, 30.9040],
  [75.8630, 30.9055],
  [75.8645, 30.9070],
  [75.8660, 30.9085],
  [75.8695, 30.9105],
];

export const DEMO_PROGRESS = [
  {
    distance: '4.8 km',
    duration: '12 min',
    instruction: 'Follow the highlighted route',
  },
  {
    distance: '4.1 km',
    duration: '10 min',
    instruction: 'Continue straight on Grand Avenue',
  },
  {
    distance: '3.5 km',
    duration: '9 min',
    instruction: 'In 500m keep right at the fork',
  },
  {
    distance: '2.8 km',
    duration: '7 min',
    instruction: 'Turn right onto Central Boulevard',
  },
  {
    distance: '1.9 km',
    duration: '5 min',
    instruction: 'Continue for 1.1 km towards Main Street',
  },
  {
    distance: '0.8 km',
    duration: '2 min',
    instruction: 'Approaching destination on right',
  },
  {
    distance: '0 km',
    duration: '0 min',
    instruction: 'You have arrived at 123 Main Street',
  },
];

/**
 * Standard MapLibre Demotiles style JSON URL (free, open source vector tiles)
 */
export const DEMO_MAP_STYLE = 'https://demotiles.maplibre.org/style.json';
