const ApiConstant = {
  Login: 'auth/login/',
  Register: 'auth/register/',
  CountryCodes: 'auth/country-codes/',
  DriverProfile: 'drivers/profile/',
  DriverDocuments: 'drivers/documents/',
  Vehicles: 'vehicles/',
  VehicleBulkUpload: (id = 1) => `vehicles/${id}/documents/bulk-upload/`,
  LocationSearch: 'location/search/',
  FareEstimate: 'rides/fare-estimate/',
  BookRide: 'rides/book/',
};

export const SUCCESS = "success";
export const FAILURE = "failure";

export default ApiConstant;
