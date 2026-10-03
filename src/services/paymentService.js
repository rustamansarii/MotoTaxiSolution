/**
 * Payment Service
 * Modular service for handling payment gateway validations, formatting, and API requests.
 * Architecture separates UI components from payment gateway APIs (Stripe, Razorpay, M-Pesa, etc.)
 */

// Detect card brand from initial digits
export const detectCardBrand = (rawNumber = '') => {
  const digits = String(rawNumber).replace(/\D/g, '');
  if (/^4/.test(digits)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
  if (/^3[47]/.test(digits)) return 'amex';
  if (/^6(011|5)/.test(digits)) return 'discover';
  if (/^(60|65|81|82)/.test(digits)) return 'rupay';
  return 'generic';
};

// Format raw input string into spaced card number (e.g. 4532 1234 5678 9012)
export const formatCardNumber = (raw = '') => {
  const digits = String(raw).replace(/\D/g, '').slice(0, 19);
  const brand = detectCardBrand(digits);
  
  // Amex: 4-6-5 format
  if (brand === 'amex') {
    const part1 = digits.slice(0, 4);
    const part2 = digits.slice(4, 10);
    const part3 = digits.slice(10, 15);
    return [part1, part2, part3].filter(Boolean).join(' ');
  }

  // Standard 4-4-4-4 format
  const parts = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(' ');
};

// Format expiration date into MM/YY
export const formatExpiryDate = (raw = '') => {
  const digits = String(raw).replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  }
  return digits;
};

// Format CVV input (digits only, max 4)
export const formatCVV = (raw = '', brand = 'generic') => {
  const maxLen = brand === 'amex' ? 4 : 3;
  return String(raw).replace(/\D/g, '').slice(0, maxLen);
};

// Luhn algorithm check for card number validation
export const isValidLuhn = (numStr = '') => {
  const digits = String(numStr).replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
};

// Validate Card Form Fields
export const validateCard = ({ cardNumber = '', cardHolder = '', expiry = '', cvv = '' }) => {
  const errors = {};
  const cleanNumber = String(cardNumber).replace(/\D/g, '');
  const brand = detectCardBrand(cleanNumber);
  const minLen = brand === 'amex' ? 15 : 16;

  // 1. Card Number Validation
  if (!cleanNumber) {
    errors.cardNumber = 'Card number is required';
  } else if (cleanNumber.length < minLen) {
    errors.cardNumber = `Card number must be at least ${minLen} digits`;
  } else if (!isValidLuhn(cleanNumber)) {
    errors.cardNumber = 'Invalid card number';
  }

  // 2. Cardholder Name Validation
  const trimmedName = String(cardHolder).trim();
  if (!trimmedName) {
    errors.cardHolder = 'Cardholder name is required';
  } else if (trimmedName.length < 3) {
    errors.cardHolder = 'Name must be at least 3 characters';
  } else if (!/^[a-zA-Z\s.'-]+$/.test(trimmedName)) {
    errors.cardHolder = 'Name can only contain letters and spaces';
  }

  // 3. Expiry Date Validation
  const cleanExpiry = String(expiry).replace(/\D/g, '');
  if (!cleanExpiry) {
    errors.expiry = 'Expiration date is required';
  } else if (cleanExpiry.length !== 4) {
    errors.expiry = 'Enter MM/YY';
  } else {
    const month = parseInt(cleanExpiry.slice(0, 2), 10);
    const year = parseInt(`20${cleanExpiry.slice(2, 4)}`, 10);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    if (month < 1 || month > 12) {
      errors.expiry = 'Invalid month (01-12)';
    } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
      errors.expiry = 'Card has expired';
    } else if (year > currentYear + 25) {
      errors.expiry = 'Invalid year';
    }
  }

  // 4. CVV Validation
  const cleanCVV = String(cvv).replace(/\D/g, '');
  const requiredCVVLen = brand === 'amex' ? 4 : 3;
  if (!cleanCVV) {
    errors.cvv = 'CVV is required';
  } else if (cleanCVV.length < requiredCVVLen) {
    errors.cvv = `CVV must be ${requiredCVVLen} digits`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Supported Mobile Money Providers
export const MOBILE_MONEY_PROVIDERS = [
  { id: 'mpesa', name: 'M-Pesa', color: '#00A859', logoIcon: 'phone-portrait' },
  { id: 'mtn', name: 'MTN Mobile Money', color: '#FFCC00', logoIcon: 'wallet' },
  { id: 'airtel', name: 'Airtel Money', color: '#E40000', logoIcon: 'phone-portrait' },
  { id: 'orange', name: 'Orange Money', color: '#FF7900', logoIcon: 'wallet' },
];

// Country codes for mobile money
export const MOBILE_MONEY_COUNTRIES = [
  { code: '+254', country: 'Kenya', flag: '🇰🇪', length: 9 },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬', length: 10 },
  { code: '+233', country: 'Ghana', flag: '🇬🇭', length: 9 },
  { code: '+256', country: 'Uganda', flag: '🇺🇬', length: 9 },
  { code: '+91', country: 'India', flag: '🇮🇳', length: 10 },
  { code: '+1', country: 'USA', flag: '🇺🇸', length: 10 },
];

// Validate Mobile Money
export const validateMobileMoney = ({ phone = '', countryCode = '+254', provider = 'mpesa' }) => {
  const errors = {};
  const cleanPhone = String(phone).replace(/\D/g, '');
  const country = MOBILE_MONEY_COUNTRIES.find((c) => c.code === countryCode) || { length: 9 };

  if (!cleanPhone) {
    errors.phone = 'Mobile phone number is required';
  } else if (cleanPhone.length < country.length - 1 || cleanPhone.length > country.length + 2) {
    errors.phone = `Phone number should be around ${country.length} digits`;
  }

  if (!provider) {
    errors.provider = 'Please select a mobile money provider';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// ==============================================================
// ASYNC API / GATEWAY SERVICE CALLS (Ready for backend gateway)
// ==============================================================

/**
 * Process Card Payment (Stripe / Gateway Tokenization)
 * Note: Never store sensitive card/CVV info locally.
 */
export const processCardPayment = async ({
  cardNumber,
  cardHolder,
  expiry,
  cvv,
  amount,
  currency = 'USD',
  rideId,
}) => {
  // Simulate network request to payment processor
  await new Promise((resolve) => setTimeout(resolve, 1800));

  const cleanNumber = String(cardNumber).replace(/\D/g, '');
  // Simulated failure check (test card ending in 0000 triggers decline)
  if (cleanNumber.endsWith('0000')) {
    throw new Error('Your card was declined by the issuing bank. Please try another card.');
  }

  const brand = detectCardBrand(cleanNumber);
  const last4 = cleanNumber.slice(-4);

  return {
    success: true,
    transactionId: `TXN_CARD_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`,
    method: 'card',
    brand,
    last4,
    cardHolder,
    amount,
    currency,
    timestamp: Date.now(),
  };
};

/**
 * Generate Dynamic QR Payment Details
 */
export const generateQRCode = async ({ rideId = 1, amount = 0, currency = 'USD' }) => {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const qrId = `QR_${rideId}_${Date.now()}`;
  const qrPayload = `payment://pay?ref=${qrId}&ride_id=${rideId}&amount=${amount}&currency=${currency}`;

  return {
    qrId,
    qrPayload,
    amount,
    currency,
    merchantName: 'MotoTaxi Ride Service',
    expiresInSeconds: 300,
    generatedAt: Date.now(),
  };
};

/**
 * Check QR Payment Status from gateway
 */
export const checkQRCodeStatus = async ({ qrId, rideId }) => {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  // In production, queries backend: GET /api/v1/payments/qr-status/?qr_id=...
  return {
    status: 'success', // 'success' | 'pending' | 'failed'
    transactionId: `TXN_QR_${Date.now()}`,
    qrId,
    rideId,
    paidAt: Date.now(),
  };
};

/**
 * Process Mobile Money STK Push / USSD Prompt
 */
export const processMobileMoneyPayment = async ({
  phone,
  countryCode,
  provider,
  amount,
  currency = 'USD',
  rideId,
}) => {
  // Simulate sending STK push prompt to user device
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const cleanPhone = String(phone).replace(/\D/g, '');
  if (cleanPhone.endsWith('0000')) {
    throw new Error('Mobile Money request timed out or was rejected by user.');
  }

  return {
    success: true,
    transactionId: `TXN_MOMO_${Date.now()}_${Math.floor(Math.random() * 8999 + 1000)}`,
    method: 'mobile_money',
    provider,
    fullPhone: `${countryCode}${cleanPhone}`,
    amount,
    currency,
    timestamp: Date.now(),
  };
};

/**
 * Confirm Cash Payment Handover
 */
export const confirmCashPayment = async ({
  rideId,
  amount,
  currency = 'USD',
  note = '',
  collected = true,
}) => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  return {
    success: true,
    status: collected ? 'collected' : 'pending',
    method: 'cash',
    transactionId: `CASH_${rideId}_${Date.now()}`,
    amount,
    currency,
    note,
    timestamp: Date.now(),
  };
};
