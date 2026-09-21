export const APP_NAME = 'Moto Taxi Solution';
export const APP_TAGLINE = 'Fast, dependable rides in minutes';

export const USER_ROLES = {
  RIDER: 'rider',
  DRIVER: 'driver',
};

export const RIDE_STATUSES = {
  IDLE: 'idle',
  SEARCHING: 'searching',
  DRIVER_ASSIGNED: 'driver_assigned',
  DRIVER_ARRIVED: 'driver_arrived',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const DRIVER_STATUSES = {
  OFFLINE: 'offline',
  ONLINE: 'online',
  REQUEST_RECEIVED: 'request_received',
  ACCEPTED: 'accepted',
  ARRIVED: 'arrived',
  IN_TRANSIT: 'in_transit',
  COMPLETED: 'completed',
};

export const PAYMENT_METHODS = [
  { id: 'card_1', type: 'card', name: 'Mastercard •••• 4242', icon: 'card', isDefault: true },
  { id: 'card_2', type: 'card', name: 'Visa •••• 8891', icon: 'card', isDefault: false },
  { id: 'apple_pay', type: 'wallet', name: 'Apple Pay', icon: 'apple', isDefault: false },
  { id: 'cash', type: 'cash', name: 'Cash at dropoff', icon: 'cash', isDefault: false },
];
