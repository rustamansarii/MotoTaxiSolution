import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import locationReducer from '../features/location/locationSlice';
import ridesReducer from '../features/rides/ridesSlice';
import driverReducer from '../features/driver/driverSlice';
import riderReducer from '../features/rider/riderSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    location: locationReducer,
    rides: ridesReducer,
    driver: driverReducer,
    rider: riderReducer,
  },
});