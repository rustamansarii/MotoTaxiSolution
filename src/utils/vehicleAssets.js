/**
 * Utility helpers to resolve vehicle images, names, and plates across the app.
 */

// Local vehicle illustrations/photos
export const VEHICLE_IMAGES = {
  SUV: require('../assets/images/vehicles/suv.jpg'),
  CAR: require('../assets/images/vehicles/car.jpg'),
  BIKE: require('../assets/images/vehicles/bike.jpg'),
  AUTO: require('../assets/images/vehicles/auto.jpg'),
};

/**
 * Returns an Image source object ({ uri: string } or require(...))
 * corresponding to the driver's vehicle data.
 */
export const getVehicleImageSource = (driver) => {
  if (!driver) {
    return VEHICLE_IMAGES.CAR;
  }

  // 1. If backend provided a remote vehicle photo URL
  const remoteUri =
    driver.vehicle_image ||
    driver.vehicle_photo ||
    driver.car_image ||
    driver.car?.image ||
    driver.car?.photo ||
    driver.vehicle?.image ||
    driver.vehicle?.photo;

  if (
    remoteUri &&
    typeof remoteUri === 'string' &&
    (remoteUri.startsWith('http://') ||
      remoteUri.startsWith('https://') ||
      remoteUri.startsWith('file://') ||
      remoteUri.startsWith('data:image/'))
  ) {
    return { uri: remoteUri };
  }

  // 2. Resolve based on vehicle make, model, name, and type
  const make = String(driver.vehicle_make || driver.car?.make || driver.vehicle?.make || '').toLowerCase();
  const model = String(driver.vehicle_model || driver.car?.model || driver.vehicle?.model || '').toLowerCase();
  const name = String(driver.vehicle || driver.vehicle_name || driver.car?.name || driver.vehicle?.name || '').toLowerCase();
  const combined = `${make} ${model} ${name}`.trim();

  const type = String(
    driver.vehicle_type ||
      driver.type ||
      driver.car?.category ||
      driver.car?.type ||
      ''
  ).toUpperCase();

  // Check for SUV / Luxury SUV / Mercedes Benz / G-Wagon
  if (
    combined.includes('g-wagon') ||
    combined.includes('gwagon') ||
    combined.includes('mercedes') ||
    combined.includes('benz') ||
    combined.includes('suv') ||
    combined.includes('thar') ||
    combined.includes('fortuner') ||
    combined.includes('scorpio') ||
    combined.includes('creta') ||
    combined.includes('defender') ||
    combined.includes('jeep') ||
    combined.includes('harrier') ||
    combined.includes('safari')
  ) {
    return VEHICLE_IMAGES.SUV;
  }

  // Check for Auto / Rickshaw
  if (
    type.includes('AUTO') ||
    type.includes('RICK') ||
    combined.includes('auto') ||
    combined.includes('rickshaw') ||
    combined.includes('tuk') ||
    combined.includes('bajaj re') ||
    combined.includes('piaggio')
  ) {
    return VEHICLE_IMAGES.AUTO;
  }

  // Check for Bike / Motorcycle / Scooter
  if (
    type.includes('BIKE') ||
    type.includes('MOTO') ||
    combined.includes('bike') ||
    combined.includes('motorcycle') ||
    combined.includes('scooter') ||
    combined.includes('cb500') ||
    combined.includes('pulsar') ||
    combined.includes('activa') ||
    combined.includes('splendor') ||
    combined.includes('bullet') ||
    combined.includes('royal enfield') ||
    combined.includes('yamaha')
  ) {
    return VEHICLE_IMAGES.BIKE;
  }

  // Check for Sedan / Standard Car / Cab
  if (
    type.includes('CAR') ||
    type.includes('CAB') ||
    type.includes('SEDAN') ||
    combined.includes('car') ||
    combined.includes('sedan') ||
    combined.includes('cab') ||
    combined.includes('swift') ||
    combined.includes('dzire') ||
    combined.includes('etios') ||
    combined.includes('honda city') ||
    combined.includes('toyota') ||
    combined.includes('hyundai')
  ) {
    return VEHICLE_IMAGES.CAR;
  }

  // Fallback based on type
  if (type === 'BIKE') return VEHICLE_IMAGES.BIKE;
  if (type === 'AUTO') return VEHICLE_IMAGES.AUTO;
  return VEHICLE_IMAGES.CAR;
};

/**
 * Returns formatted vehicle model/make name.
 */
export const getVehicleDisplayName = (driver, fallback = 'Vehicle') => {
  if (!driver) return fallback;

  if (driver.vehicle_make && driver.vehicle_model) {
    return `${driver.vehicle_make} ${driver.vehicle_model}`.trim();
  }

  if (driver.vehicle && typeof driver.vehicle === 'string' && driver.vehicle.trim()) {
    return driver.vehicle.trim();
  }

  if (driver.car?.model) {
    return driver.car.model;
  }

  if (driver.vehicle_model) {
    return driver.vehicle_model;
  }

  if (driver.vehicle_make) {
    return driver.vehicle_make;
  }

  if (driver.car?.make) {
    return driver.car.make;
  }

  return fallback;
};

/**
 * Returns formatted vehicle license plate number.
 */
export const getVehiclePlateNumber = (driver, fallback = '') => {
  if (!driver) return fallback;

  return (
    driver.vehicle_plate ||
    driver.vehicle_number ||
    driver.plate_number ||
    driver.plate ||
    driver.car?.plateNumber ||
    driver.car?.plate ||
    driver.car?.vehicle_plate ||
    driver.car?.plate_number ||
    fallback
  );
};

/**
 * Returns canonical icon name for Icon component according to vehicle type.
 * 'CAR' -> 'car'
 * 'BIKE' -> 'bike'
 * 'AUTO' -> 'auto'
 */
export const getVehicleIconName = (vehicleType) => {
  if (!vehicleType) return 'car';
  const t = String(vehicleType).trim().toUpperCase();
  if (
    t === 'BIKE' ||
    t === 'MOTORCYCLE' ||
    t === 'MOTO' ||
    t === 'BICYCLE' ||
    t === 'SCOOTER' ||
    t === 'TWO_WHEELER'
  ) {
    return 'bike';
  }
  if (
    t === 'AUTO' ||
    t === 'RICKSHAW' ||
    t === 'TUKTUK' ||
    t === 'TUK_TUK' ||
    t === 'THREE_WHEELER'
  ) {
    return 'auto';
  }
  return 'car';
};
