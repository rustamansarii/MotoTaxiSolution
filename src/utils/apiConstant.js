const ApiConstant = {
  Login: 'auth/login/',
  Register: 'auth/register/',
  CountryCodes: 'auth/country-codes/',
  UserProfile: 'auth/profile/',
  AuthMe: 'auth/me/',
  DriverProfile: 'drivers/profile/',
  DriverDocuments: 'drivers/documents/',
  Vehicles: 'vehicles/',
  VehicleBulkUpload: (id = 1) => `vehicles/${id}/documents/bulk-upload/`,
  LocationSearch: 'location/search/',
  FareEstimate: 'rides/fare-estimate/',
  BookRide: 'rides/book/',
  MyRides: 'rides/my-rides/',
  DriverRides: 'rides/driver-rides/',
  RiderProfile: 'auth/rider-profile/',
  DriverGoOnline: 'drivers/go-online/',
  DriverGoOffline: 'drivers/go-offline/',
  DriverWallet: 'drivers/wallet/',
  DriverWalletTransactions: 'drivers/wallet/transactions/',
  DriverWalletSummary: 'drivers/wallet/summary/',
  DriverHomeStats: 'drivers/stats/home/',
  DeleteAccount: 'auth/delete-account/',
  RateRide: (id) => `rides/${id}/rate/`,
};

export const SUCCESS = "success";
export const FAILURE = "failure";

export default ApiConstant;
