/**
 * Coordinate resolver and geocoding helper.
 * Prevents map from routing to wrong default cities (like Ludhiana)
 * when destination addresses (like Shimla) arrive without explicit drop_lat/drop_lon.
 */
import { apiGet } from './apiClient';
import ApiConstant from './apiConstant';

// Well-known coordinates [longitude, latitude] for fast, zero-delay resolution
export const PREMAPPED_LOCATIONS = [
  // Himachal Pradesh
  { keywords: ['shimla', 'simla', 'ridge', 'mall road shimla'], coords: [77.1734, 31.1048] },
  { keywords: ['kufri'], coords: [77.2667, 31.0979] },
  { keywords: ['chail'], coords: [77.1892, 30.9678] },
  { keywords: ['solan'], coords: [77.1089, 30.9045] },
  { keywords: ['kasauli'], coords: [76.9649, 30.9013] },
  { keywords: ['manali'], coords: [77.1887, 32.2432] },
  { keywords: ['kullu'], coords: [77.1095, 31.9579] },
  { keywords: ['mandi'], coords: [76.9317, 31.7087] },
  { keywords: ['bilaspur'], coords: [76.7636, 31.3260] },
  { keywords: ['dharamshala', 'dharamsala', 'mcleodganj'], coords: [76.3234, 32.2190] },
  { keywords: ['palampur'], coords: [76.5363, 32.1109] },
  { keywords: ['una'], coords: [76.2711, 31.4685] },
  { keywords: ['baddi'], coords: [76.7914, 30.9578] },
  { keywords: ['nalagarh'], coords: [76.7167, 31.0422] },
  { keywords: ['parwanoo'], coords: [76.9582, 30.8383] },

  // Tricity & Nearby
  { keywords: ['chandigarh', 'purv marg', 'sector 17 chandigarh'], coords: [76.7794, 30.7333] },
  { keywords: ['mohali', 'sas nagar', 'phase 7 mohali', 'phase 8 mohali'], coords: [76.7179, 30.7046] },
  { keywords: ['panchkula'], coords: [76.8606, 30.6942] },
  { keywords: ['zirakpur'], coords: [76.8188, 30.6425] },
  { keywords: ['kharar'], coords: [76.6493, 30.7456] },
  { keywords: ['dera bassi', 'derabassi'], coords: [76.8436, 30.5843] },
  { keywords: ['kalka'], coords: [76.9366, 30.8344] },
  { keywords: ['pinjore'], coords: [76.9149, 30.7972] },

  // Punjab
  { keywords: ['ludhiana'], coords: [75.8573, 30.9005] },
  { keywords: ['jalandhar'], coords: [75.5762, 31.3260] },
  { keywords: ['amritsar', 'golden temple'], coords: [74.8723, 31.6340] },
  { keywords: ['patiala'], coords: [76.3869, 30.3398] },
  { keywords: ['bathinda', 'bhatinda'], coords: [74.9455, 30.2110] },
  { keywords: ['hoshiarpur'], coords: [75.9115, 31.5273] },
  { keywords: ['phagwara'], coords: [75.7708, 31.2240] },
  { keywords: ['khanna'], coords: [76.2167, 30.7067] },
  { keywords: ['rajpura'], coords: [76.5944, 30.4833] },

  // Haryana & Delhi NCR
  { keywords: ['ambala', 'ambala cantt', 'ambala city'], coords: [76.8173, 30.3782] },
  { keywords: ['kurukshetra'], coords: [76.8783, 29.9695] },
  { keywords: ['karnal'], coords: [76.9897, 29.6857] },
  { keywords: ['panipat'], coords: [76.9635, 29.3909] },
  { keywords: ['sonipat'], coords: [77.0199, 28.9931] },
  { keywords: ['delhi', 'new delhi', 'connaught place', 'india gate'], coords: [77.2090, 28.6139] },
  { keywords: ['gurgaon', 'gurugram', 'cyber city'], coords: [77.0266, 28.4595] },
  { keywords: ['noida', 'greater noida'], coords: [77.3910, 28.5355] },
  { keywords: ['faridabad'], coords: [77.3178, 28.4089] },

  // Uttarakhand
  { keywords: ['dehradun', 'dehradoon'], coords: [78.0322, 30.3165] },
  { keywords: ['mussoorie'], coords: [78.0707, 30.4598] },
  { keywords: ['haridwar'], coords: [78.1642, 29.9457] },
  { keywords: ['rishikesh'], coords: [78.2676, 30.0869] },
  { keywords: ['roorkee'], coords: [77.8880, 29.8543] },

  // Major Metros & States
  { keywords: ['jaipur'], coords: [75.7873, 26.9124] },
  { keywords: ['mumbai', 'bombay'], coords: [72.8777, 19.0760] },
  { keywords: ['pune'], coords: [73.8567, 18.5204] },
  { keywords: ['bangalore', 'bengaluru'], coords: [77.5946, 12.9716] },
  { keywords: ['hyderabad'], coords: [78.4867, 17.3850] },
  { keywords: ['chennai'], coords: [80.2707, 13.0827] },
  { keywords: ['kolkata', 'calcutta'], coords: [88.3639, 22.5726] },
];

/**
 * Fast synchronous lookup of coordinates [longitude, latitude] by place / city name.
 */
export const getPremappedCoordinates = (addressText) => {
  if (!addressText || typeof addressText !== 'string') return null;
  const clean = addressText.toLowerCase();

  for (const item of PREMAPPED_LOCATIONS) {
    for (const kw of item.keywords) {
      if (clean.includes(kw)) {
        return item.coords;
      }
    }
  }
  return null;
};

/**
 * Asynchronously geocode an address string to [longitude, latitude].
 * First tries instant pre-mapped city list, then backend LocationSearch, then Nominatim.
 */
export const geocodeAddress = async (addressText) => {
  if (!addressText || typeof addressText !== 'string' || !addressText.trim()) {
    return null;
  }

  // 1. Fast pre-mapped cache
  const fast = getPremappedCoordinates(addressText);
  if (fast) return fast;

  const query = addressText.trim();

  // 2. Query backend location search API
  try {
    const data = await apiGet(ApiConstant.LocationSearch, { q: query });
    const results = Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data)
      ? data
      : [];
    if (results.length > 0 && results[0]) {
      const lon = parseFloat(results[0].lon || results[0].longitude);
      const lat = parseFloat(results[0].lat || results[0].latitude);
      if (!isNaN(lon) && !isNaN(lat)) {
        return [lon, lat];
      }
    }
  } catch (err) {
    console.warn('[CoordinateResolver] Backend geocode failed for query:', query, err?.message);
  }

  // 3. Fallback to OpenStreetMap Nominatim directly
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MotoTaxiApp/1.0' },
    });
    if (res.ok) {
      const items = await res.json();
      if (Array.isArray(items) && items.length > 0) {
        const lon = parseFloat(items[0].lon);
        const lat = parseFloat(items[0].lat);
        if (!isNaN(lon) && !isNaN(lat)) {
          return [lon, lat];
        }
      }
    }
  } catch (e) {
    console.warn('[CoordinateResolver] Nominatim geocode failed:', e?.message);
  }

  return null;
};

/**
 * Resolves drop coordinates [longitude, latitude] safely from all possible sources.
 * Never defaults to Ludhiana if destination is Shimla or other location!
 */
export const resolveDropCoordinates = (params = {}, incomingReq = {}, fallbackAddress = '') => {
  // 1. Explicit dropCoordinates array [lon, lat]
  if (Array.isArray(params?.dropCoordinates) && params.dropCoordinates.length === 2) {
    const [lon, lat] = params.dropCoordinates;
    if (!isNaN(Number(lon)) && !isNaN(Number(lat)) && (Number(lon) !== 0 || Number(lat) !== 0)) {
      return [Number(lon), Number(lat)];
    }
  }

  // 2. Numeric drop_lat / drop_lon pairs
  const dLon =
    params?.drop_lon ??
    incomingReq?.drop_lon ??
    incomingReq?.dropoff_lon ??
    incomingReq?.destination_lon ??
    incomingReq?.drop_longitude ??
    incomingReq?.dropoff_longitude ??
    incomingReq?.destination_longitude;

  const dLat =
    params?.drop_lat ??
    incomingReq?.drop_lat ??
    incomingReq?.dropoff_lat ??
    incomingReq?.destination_lat ??
    incomingReq?.drop_latitude ??
    incomingReq?.dropoff_latitude ??
    incomingReq?.destination_latitude;

  if (dLon !== undefined && dLat !== undefined && dLon !== null && dLat !== null) {
    const numLon = Number(dLon);
    const numLat = Number(dLat);
    if (!isNaN(numLon) && !isNaN(numLat) && (numLon !== 0 || numLat !== 0)) {
      return [numLon, numLat];
    }
  }

  // 3. Address-based pre-mapped lookup
  const targetAddress =
    params?.destination ||
    incomingReq?.drop_address ||
    incomingReq?.destination_address ||
    incomingReq?.dropoff_address ||
    incomingReq?.destination ||
    fallbackAddress ||
    '';

  const mapped = getPremappedCoordinates(targetAddress);
  if (mapped) {
    return mapped;
  }

  // 4. Default fallback: Only if address specifically mentioned Ludhiana, return Ludhiana.
  // Otherwise, default to [77.1734, 31.1048] if Shimla or nearby regional center.
  return [76.7794, 30.7333]; // Chandigarh regional center
};

/**
 * Resolves pickup coordinates [longitude, latitude] safely from all possible sources.
 */
export const resolvePickupCoordinates = (params = {}, incomingReq = {}, fallbackAddress = '') => {
  if (Array.isArray(params?.pickupCoordinates) && params.pickupCoordinates.length === 2) {
    const [lon, lat] = params.pickupCoordinates;
    if (!isNaN(Number(lon)) && !isNaN(Number(lat))) {
      return [Number(lon), Number(lat)];
    }
  }

  const pLon =
    params?.pickup_lon ??
    incomingReq?.pickup_lon ??
    incomingReq?.pickup_longitude;

  const pLat =
    params?.pickup_lat ??
    incomingReq?.pickup_lat ??
    incomingReq?.pickup_latitude;

  if (pLon !== undefined && pLat !== undefined && pLon !== null && pLat !== null) {
    const numLon = Number(pLon);
    const numLat = Number(pLat);
    if (!isNaN(numLon) && !isNaN(numLat)) {
      return [numLon, numLat];
    }
  }

  const targetAddress =
    params?.pickup ||
    incomingReq?.pickup_address ||
    fallbackAddress ||
    '';

  const mapped = getPremappedCoordinates(targetAddress);
  if (mapped) {
    return mapped;
  }

  return [76.7835809, 30.6948328]; // Prasad group, Chandigarh
};
