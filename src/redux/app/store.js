import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import locationReducer from '../features/location/locationSlice';
import ridesReducer from '../features/rides/ridesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    location: locationReducer,
    rides: ridesReducer,
  },
});