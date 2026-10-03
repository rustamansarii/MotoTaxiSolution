const ApiConstant = {
  Login: 'auth/login/',
  Register: 'auth/register/',
  CountryCodes: 'auth/country-codes/',
  UserProfile: 'auth/profile/',
  DriverProfile: 'drivers/profile/',
  DriverDocuments: 'drivers/documents/',
  Vehicles: 'vehicles/',
  VehicleBulkUpload: (id = 1) => `vehicles/${id}/documents/bulk-upload/`,
  LocationSearch: 'location/search/',
  FareEstimate: 'rides/fare-estimate/',
  BookRide: 'rides/book/',
  RiderProfile: 'auth/rider-profile/',
  DriverGoOnline: 'drivers/go-online/',
  DriverGoOffline: 'drivers/go-offline/',
  DriverWallet: 'drivers/wallet/',
  DriverWalletTransactions: 'drivers/wallet/transactions/',
  DriverWalletSummary: 'drivers/wallet/summary/',
  DeleteAccount: 'auth/delete-account/',
};

export const SUCCESS = "success";
export const FAILURE = "failure";

export default ApiConstant;
