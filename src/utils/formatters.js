export const formatCurrency = (amount, currency = '$') => {
  return `${currency}${Number(amount || 0).toFixed(2)}`;
};

export const formatDistance = (miles) => {
  return `${Number(miles || 0).toFixed(1)} mi`;
};

export const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${Math.round(minutes)} mins`;
  }
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hrs}h ${mins}m`;
};

export const maskPhoneNumber = (phone) => {
  if (!phone) return '';
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1-***-$2');
};

export const formatTimeAgo = (timestamp) => {
  return timestamp || 'Just now';
};
