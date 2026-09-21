export const MOCK_WALLET = {
  riderBalance: 68.45,
  driverBalance: 842.5,
  cashoutAvailable: 842.5,
  lastPayoutDate: 'Sep 15, 2026',
};

export const MOCK_PAYMENT_METHODS = [
  {
    id: 'pm_1',
    name: 'Apple Pay',
    type: 'apple_pay',
    subtitle: 'Default payment',
    isDefault: true,
  },
  {
    id: 'pm_2',
    name: 'Mastercard •••• 4242',
    type: 'card',
    subtitle: 'Expires 08/28',
    isDefault: false,
  },
  {
    id: 'pm_3',
    name: 'Visa •••• 9012',
    type: 'card',
    subtitle: 'Expires 11/27',
    isDefault: false,
  },
  {
    id: 'pm_4',
    name: 'Cash Payment',
    type: 'cash',
    subtitle: 'Pay driver directly',
    isDefault: false,
  },
];

export const MOCK_TRANSACTIONS = [
  {
    id: 'tx_1',
    title: 'Ride to JFK Terminal 4',
    date: 'Today, 11:20 AM',
    amount: -54.2,
    type: 'ride',
    status: 'Completed',
  },
  {
    id: 'tx_2',
    title: 'Wallet Top Up (Apple Pay)',
    date: 'Yesterday, 3:10 PM',
    amount: 50.0,
    type: 'topup',
    status: 'Completed',
  },
  {
    id: 'tx_3',
    title: 'Ride to Greenwich Village',
    date: '16 Sep, 7:45 PM',
    amount: -22.5,
    type: 'ride',
    status: 'Completed',
  },
  {
    id: 'tx_4',
    title: 'Cashback Promotion',
    date: '14 Sep, 12:00 PM',
    amount: 5.0,
    type: 'promo',
    status: 'Completed',
  },
];

export const MOCK_DRIVER_EARNINGS_BREAKDOWN = [
  { day: 'Mon', amount: 142.5, trips: 7 },
  { day: 'Tue', amount: 168.0, trips: 8 },
  { day: 'Wed', amount: 110.2, trips: 5 },
  { day: 'Thu', amount: 195.4, trips: 9 },
  { day: 'Fri', amount: 226.4, trips: 13 },
  { day: 'Sat', amount: 0.0, trips: 0 },
  { day: 'Sun', amount: 0.0, trips: 0 },
];
